import ts from "typescript";

import {
    createConnection,
    TextDocuments,
    ProposedFeatures,
    TextDocumentSyncKind,
    Location,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { getLanguageService as getHTMLLanguageService } from "vscode-html-languageservice";
import { getCSSLanguageService } from "vscode-css-languageservice";

import CompletionConverter from "../CompletionConverter";
import TypeScriptLanguageService from "../TypeScriptLanguageService";

import getDefinitions from "./getDefinitions";
import extractScriptContent from "./extractScriptContent";
import updateRiotDocument from "./updateRiotDocument";
import getUriFromPath from "./getUriFromPath";
import isInsideScript from "./isInsideScript";
import getCompletionsAndScriptOffset from "./getCompletionAndScriptOffset";
import isInsideStyle from "./isInsideStyle";
import getHoverInfo from "./getHoverInfo";
import pathFromUri from "./pathFromUri";

const connection = createConnection(ProposedFeatures.all);

const documents = new TextDocuments(TextDocument);

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
            const { completions, scriptOffset } = getCompletionsAndScriptOffset({
                document, position: params.position,
                tsLanguageService, connection
            });

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
        return getHoverInfo({
            document, position: params.position,
            tsLanguageService, connection
        });
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