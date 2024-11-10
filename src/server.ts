import * as ts from "typescript";

import {
    createConnection,
    TextDocuments,
    ProposedFeatures,
    TextDocumentSyncKind,
    MarkupKind,
    Location,
    Range
} from "vscode-languageserver/node";
import { Position, TextDocument } from "vscode-languageserver-textdocument";
import { getLanguageService as getHTMLLanguageService } from "vscode-html-languageservice";
import { getCSSLanguageService } from "vscode-css-languageservice";
import CompletionConverter from "./CompletionConverter";
import TypeScriptLanguageService from "./TypeScriptLanguageService";

import getDefinitions from "./server/getDefinitions";
import isInsideTag from "./server/isInsideTag";
import extractScriptContent from "./server/extractScriptContent";
import updateRiotDocument from "./server/updateRiotDocument";
import getUriFromPath from "./server/getUriFromPath";

const connection = createConnection(ProposedFeatures.all);

const documents = new TextDocuments(TextDocument);

function pathFromUri(uri) {
    const url = new URL(uri);
    return decodeURIComponent(url.pathname.startsWith("/") ?
        url.pathname.slice(1) : url.pathname
    );
}

const tsLanguageService = new TypeScriptLanguageService();
const htmlLanguageService = getHTMLLanguageService();
const cssLanguageService = getCSSLanguageService();

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
            },
            hoverProvider: true,
            definitionProvider: true
        },
    };
});

function isInsideScript(document, position) {
    return isInsideTag(document, position, "script");
}

function isInsideStyle(document, position) {
    return isInsideTag(document, position, "style");
}

function isInsideExpression(document, position) {
    const text = document.getText();
    const offset = document.offsetAt(position);
    const beforeCursor = text.slice(0, offset);
    
    const expressionMatch = beforeCursor.match(/\{[^}]*$/);
    
    return !!expressionMatch;
}

function getCompletionsAndScriptOffset(
    document: TextDocument,
    position: Position
) {
    if (tsLanguageService == null) {
        connection.console.log("No Language Service");
        return {
            completions: undefined,
            scriptOffset: { line: 0, character: 0 }
        };
    }
    const { filePath, scriptOffset } = updateRiotDocument(
        document, tsLanguageService
    );

    if (scriptOffset < 0) {
        connection.console.log("No script content found");
        return {
            completions: undefined,
            scriptOffset: { line: 0, character: 0 }
        };
    }

    const adjustedRequestedOffset = (
        document.offsetAt(position) - scriptOffset
    );

    try {
        // connection.console.log(
        //     `${content.substring(
        //         Math.max(0, adjustedRequestedOffset - 100),
        //         adjustedRequestedOffset
        //     )}|${content.substring(
        //         adjustedRequestedOffset,
        //         adjustedRequestedOffset + 100
        //     )}`
        // );
        
        let completions = tsLanguageService.getCompletionsAtPosition(filePath, adjustedRequestedOffset);
        if (completions) {
            connection.console.log(`First 5 completions:\n${completions.entries.slice(0, 5).map(entry => JSON.stringify(entry, null, 2)).join("\n")}\n\n`);
        } else {
            connection.console.log(`No completions...`);
        }

        return {
            completions,
            scriptOffset
        };
    } catch (error) {
        connection.console.error(`Error in jsCompletion: ${error}`);
        connection.console.error(`Error stack: ${error.stack}`);
        return {
            completions: undefined,
            scriptOffset: { line: 0, character: 0 }
        };
    }
}

function getHoverInfo(
    document: TextDocument,
    position: Position
) {
    if (tsLanguageService == null) {
        connection.console.log("No Language Service");
        return null;
    }
    const { filePath, scriptOffset } = updateRiotDocument(
        document, tsLanguageService
    );

    if (scriptOffset < 0) {
        connection.console.log("No script content found");
        return null;
    }

    const adjustedRequestedOffset = (
        document.offsetAt(position) - scriptOffset
    );

    try {
        const quickInfo = tsLanguageService.getQuickInfoAtPosition(filePath, adjustedRequestedOffset);

        if (!quickInfo) {
            return null;
        }

        const displayText = (
            '```typescript\n' +
            ts.displayPartsToString(quickInfo.displayParts || []) +
            '\n```'
        );

        // Format documentation as regular markdown
        const documentation = (quickInfo.documentation ?
            ts.displayPartsToString(
                quickInfo.documentation
            ).split('\n').map(line => line.trim()).join('\n\n') :
            ''
        );

        // Handle tags if present
        const tags = quickInfo.tags?.map(tag => {
            const tagText = ts.displayPartsToString(tag.text);
            switch (tag.name) {
                case 'param':
                    return `*@param* \`${tag.text}\``;
                case 'returns':
                    return `*@returns* ${tagText}`;
                case 'example':
                    return `*Example:*\n\`\`\`typescript\n${tagText}\n\`\`\``;
                default:
                    return `*@${tag.name}* ${tagText}`;
            }
        }).join('\n\n');

        let contents = displayText;
        if (documentation) {
            contents += '\n\n---\n\n' + documentation;
        }
        if (tags) {
            contents += '\n\n---\n\n' + tags;
        }
    
        return {
            contents: {
                kind: MarkupKind.Markdown,
                value: contents
            }
        };
    } catch (error) {
        connection.console.error(`Error in jsCompletion: ${error}`);
        connection.console.error(`Error stack: ${error.stack}`);
        return null;
    }
}

connection.onCompletion(async (params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return [];
    }

    try {
        if (
            isInsideScript(document, params.position)
            // || isInsideExpression(document, textDocumentPosition.position)
        ) {
            const { completions, scriptOffset } = getCompletionsAndScriptOffset(
                document, params.position
            );

            // TODO: add scriptOffset to range of replacement

            return CompletionConverter.convert(completions);
        } else if (isInsideStyle(document, params.position)) {

            // TODO: should extract content from style tag, and remap position after completions
            // connection.console.log("Requested position is inside style");
            // const parsedStylesheet = cssLanguageService.parseStylesheet(document);
            // const cssCompletions = cssLanguageService.doComplete(document, params.position, parsedStylesheet);
            return {
                isIncomplete: false,
                items: []
            };
        } else {
            connection.console.log("Requested position is inside html");
            const htmlDocument = htmlLanguageService.parseHTMLDocument(document);
            const htmlCompletions = htmlLanguageService.doComplete(document, params.position, htmlDocument);
            return htmlCompletions;
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

connection.onHover((params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return null;
    }

    if (isInsideScript(document, params.position)) {
        return getHoverInfo(document, params.position);
    }
    return null;
});


connection.onDefinition(async (params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return null;
    }

    if (!isInsideScript(document, params.position)) {
        return null;
    }

    const definitions = getDefinitions({
        document, position: params.position,
        tsLanguageService, connection
    }).map(({
        path, range,
        targetSelectionRange, originSelectionRange
    }) => ({
        uri: getUriFromPath(path),
        range,
        targetSelectionRange,
        originSelectionRange
    }));
    if (definitions.length === 0) {
        return null;
    }

    if (definitions.some(def => def.targetSelectionRange)) {
        return definitions.map(def => ({
            targetUri: def.uri,
            targetRange: def.range,
            targetSelectionRange: def.targetSelectionRange!,
            originSelectionRange: def.originSelectionRange
        }));
    }

    return definitions.map(def => Location.create(def.uri, def.range));
});

connection.onRequest('custom/logProgramFiles', async (params) => {
    const program = tsLanguageService.getProgram();
    if (program == null) {
        connection.console.log("No program");
        return;
    }

    const rootFileNames = program.getRootFileNames();

    connection.console.log("Root files:");
    rootFileNames.forEach(rootFileName => {
        connection.console.log(rootFileName);
    });

    const rootSourceFiles: Array<ts.SourceFile> = [];

    connection.console.log("Source files:");
    program.getSourceFiles().forEach(sourceFile => {
        if (rootFileNames.includes(sourceFile.fileName)) {
            rootSourceFiles.push(sourceFile);
        }
        connection.console.log(sourceFile.fileName);
    });
});

connection.onRequest('custom/logTypeAtCursor', async ({
    uri, cursorPosition
}) => {
    const document = documents.get(uri);
    if (!document) {
        connection.console.log(`Document "${uri}" not found`);
        return;
    }

    const url = new URL(document.uri);
    const filePath = decodeURIComponent(url.pathname.startsWith("/") ?
        url.pathname.slice(1) : url.pathname
    );

    connection.console.log(JSON.stringify({
        uri,
        filePath,
        cursorPosition
    }, null, 2));

    const { scriptOffset } = updateRiotDocument(
        document, tsLanguageService
    );

    const info = tsLanguageService.getQuickInfoAtPosition(
        filePath, cursorPosition - scriptOffset
    );
    connection.console.log(`Type at ${cursorPosition}: ${
        // JSON.stringify(info, null, 2)
        info?.displayParts?.map(p => p.text).join('')
    }`);
});

connection.onRequest('custom/logScriptContent', async ({ uri }) => {
    const document = documents.get(uri);
    if (!document) {
        connection.console.log(`Document "${uri}" not found`);
        return;
    }

    const { content } = extractScriptContent(document);
    connection.console.log(`Script content of "${pathFromUri(document.uri)}":\n\`\`\`\n${content}\n\`\`\`\n`);
});

connection.onShutdown(() => {
    tsLanguageService.dispose();
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
