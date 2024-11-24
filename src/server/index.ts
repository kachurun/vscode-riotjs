import {
    createConnection,
    TextDocuments,
    ProposedFeatures
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { getLanguageService as getHTMLLanguageService } from "vscode-html-languageservice";
import { getCSSLanguageService } from "vscode-css-languageservice";

import TypeScriptLanguageService from "../TypeScriptLanguageService";

import { setState } from "./core/state";

import onGetContentTypeAtCursor from "./custom-handlers/onGetContentTypeAtCursor";

import onDidDocumentChangeContent from "./document-handlers/onDidDocumentChangeContent";
import onDidDocumentClose from "./document-handlers/onDidDocumentClose";

import onInitialize from "./initialization-handlers/onInitialize";
import onShutdown from "./initialization-handlers/onShutdown";

import onLogCompiledComponent from "./log-handlers/onLogCompiledComponent";
import onLogContentTypeAtCursor from "./log-handlers/onLogContentTypeAtCursor";
import onLogDeclaration from "./log-handlers/onLogDeclaration";
import onLogProgramFiles from "./log-handlers/onLogProgramFiles";
import onLogScriptContent from "./log-handlers/onLogScriptContent";
import onLogTypeAtCursor from "./log-handlers/onLogTypeAtCursor";

import onCompletion from "./lsp-handlers/onCompletion";
import onCompletionResolve from "./lsp-handlers/onCompletionResolve";
import onDefinition from "./lsp-handlers/onDefinition";
import onHover from "./lsp-handlers/onHover";

import RiotDeclarationDocumentsHandler from "./riot-documents/RiotDeclarationDocumentsHandler";


const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

setState({
    connection,
    documents,

    tsLanguageService: new TypeScriptLanguageService({
        documentsHandlers: [
            RiotDeclarationDocumentsHandler
        ]
    }),
    htmlLanguageService: getHTMLLanguageService(),
    cssLanguageService: getCSSLanguageService(),

    hasConfigurationCapability: false,
    hasWorkspaceFolderCapability: false,
    hasDiagnosticRelatedInformationCapability: false
});

connection.onInitialize(onInitialize);

documents.onDidChangeContent(onDidDocumentChangeContent);
documents.onDidClose(onDidDocumentClose);

connection.onCompletion(onCompletion);

connection.onCompletionResolve(onCompletionResolve);

connection.onHover(onHover);

connection.onDefinition(onDefinition);

connection.onRequest(
    "custom/getContentTypeAtCursor",
    onGetContentTypeAtCursor
);
connection.onRequest(
    "custom/logCompiledComponent",
    onLogCompiledComponent
);
connection.onRequest(
    "custom/logContentTypeAtCursor",
    onLogContentTypeAtCursor
);
connection.onRequest(
    "custom/logDeclaration",
    onLogDeclaration
);
connection.onRequest(
    "custom/logProgramFiles",
    onLogProgramFiles
);
connection.onRequest(
    "custom/logScriptContent",
    onLogScriptContent
);
connection.onRequest(
    "custom/logTypeAtCursor",
    onLogTypeAtCursor
);

connection.onShutdown(onShutdown);

documents.listen(connection);
connection.listen();