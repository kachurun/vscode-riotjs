import * as ts from "typescript";

import {
    createConnection,
    TextDocuments,
    ProposedFeatures,
    CompletionItem,
    TextDocumentSyncKind,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { getLanguageService } from "vscode-html-languageservice";
import CompletionConverter from "./CompletionConverter";

const connection = createConnection(ProposedFeatures.all);

const documents = new TextDocuments(TextDocument);

const htmlLanguageService = getLanguageService();

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

connection.onInitialize((params) => {
    connection.console.log("Initializing Language Server");
    const capabilities = params.capabilities;

    hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration);
    hasWorkspaceFolderCapability = !!(capabilities.workspace && !!capabilities.workspace.workspaceFolders);
    hasDiagnosticRelatedInformationCapability = !!(
        capabilities.textDocument &&
        capabilities.textDocument.publishDiagnostics &&
        capabilities.textDocument.publishDiagnostics.relatedInformation
    );

    return {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Incremental,
            completionProvider: {
                resolveProvider: true,
                triggerCharacters: ["<", " ", ":", "{", "."],
            }
        },
    };
});

function isInsideScript(document, position) {
    const text = document.getText();
    const offset = document.offsetAt(position);
    const beforeCursor = text.slice(0, offset);

    const scriptOpenTag = /<script[^>]*>/gi;
    const scriptCloseTag = /<\/script>/gi;

    let scriptStart = -1;
    let match;

    while ((match = scriptOpenTag.exec(beforeCursor)) !== null) {
        scriptStart = match.index + match[0].length;
    }

    if (scriptStart === -1) return false;

    const afterScriptStart = text.slice(scriptStart);
    const scriptEnd = afterScriptStart.search(scriptCloseTag);

    return scriptEnd === -1 || offset < scriptStart + scriptEnd;
}

function isInsideStyle(document, position) {
    const text = document.getText();
    const offset = document.offsetAt(position);
    const beforeCursor = text.slice(0, offset);

    const styleMatch = beforeCursor.match(/<style[^>]*>(?:.|\n)*$/);
    return !!styleMatch;
}

function isInsideExpression(document, position) {
    const text = document.getText();
    const offset = document.offsetAt(position);
    const beforeCursor = text.slice(0, offset);
    
    const expressionMatch = beforeCursor.match(/\{[^}]*$/);
    
    return !!expressionMatch;
}

connection.onCompletion(async (textDocumentPosition) => {
    const document = documents.get(textDocumentPosition.textDocument.uri);
    if (!document) {
        return [];
    }

    try {
        if (
            isInsideScript(document, textDocumentPosition.position)
            // || isInsideExpression(document, textDocumentPosition.position)
        ) {
            const result = await connection.sendRequest(
                "custom/jsCompletion", textDocumentPosition
            ) as {
                completions: ts.WithMetadata<ts.CompletionInfo> | undefined,
                scriptOffset: { line: 0, character: 0 }
            };

            const { completions, scriptOffset } = result;

            // TODO: add scriptOffset to range of replacement

            return CompletionConverter.convert(completions);
        } else if (isInsideStyle(document, textDocumentPosition.position)) {
            const result = await connection.sendRequest(
                "custom/cssCompletion",
                {
                    textDocument: textDocumentPosition.textDocument,
                    position: textDocumentPosition.position,
                }
            );
            return {
                isIncomplete: false,
                items: (result || []) as CompletionItem[]
            };
        } else {
            const htmlDocument = htmlLanguageService.parseHTMLDocument(document);
            const htmlCompletions = htmlLanguageService.doComplete(document, textDocumentPosition.position, htmlDocument);
            return {
                isIncomplete: false,
                items: htmlCompletions.items
            };
        }
    } catch (error) {
        connection.console.error(`Error in completion handler: ${error}`);
        connection.console.error(`Stack trace: ${error.stack}`);
        return {
            isIncomplete: false,
            items: []
        };
    }
});

connection.onCompletionResolve((item) => {
    return item;
});

documents.listen(connection);

connection.listen();

function mapTextEdit(textEdit, scriptOffset) {
    if (typeof textEdit !== "object" || textEdit === null) {
        return textEdit;
    }

    const { range } = textEdit;
    if (Array.isArray(range) && range.length === 2) {
        connection.console.log(`Mapping textEdit: ${JSON.stringify(textEdit, null, 2)}`);
        const start = {
            line: range[0].line + scriptOffset.line,
            character: range[0].character + (range[0].line === 0 ?
                scriptOffset.character : 0
            )
        };
        const end = {
            line: range[1].line + scriptOffset.line,
            character: range[1].character + (range[1].line === 0 ?
                scriptOffset.character : 0
            )
        };
        textEdit.range = { start, end };
    } else {
        connection.console.log(`Not mapping textEdit: ${JSON.stringify(textEdit, null, 2)}`);
    }
    return textEdit;
}
