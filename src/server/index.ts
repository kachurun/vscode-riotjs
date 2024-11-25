import {
    createConnection,
    TextDocuments,
    ProposedFeatures
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { getLanguageService as getHTMLLanguageService } from "vscode-html-languageservice";
import { getCSSLanguageService } from "vscode-css-languageservice";

import TypeScriptLanguageService from "../TypeScriptLanguageService";

import RiotDeclarationDocumentsHandler from "./core/riot-documents/RiotDeclarationDocumentsHandler";

import { setState } from "./core/state";

import onGetContentTypeAtCursor from "./handlers/custom/onGetContentTypeAtCursor";

import onDidDocumentChangeContent from "./handlers/document/onDidDocumentChangeContent";
import onDidDocumentClose from "./handlers/document/onDidDocumentClose";

import onInitialize from "./handlers/initialization/onInitialize";
import onShutdown from "./handlers/initialization/onShutdown";

import onLogCompiledComponent from "./handlers/log/onLogCompiledComponent";
import onLogContentTypeAtCursor from "./handlers/log/onLogContentTypeAtCursor";
import onLogDeclaration from "./handlers/log/onLogDeclaration";
import onLogExpressionScopeFunction from "./handlers/log/onLogExpressionScopeFunction";
import onLogProgramFiles from "./handlers/log/onLogProgramFiles";
import onLogScriptContent from "./handlers/log/onLogScriptContent";
import onLogSlots from "./handlers/log/onLogSlots";
import onLogTypeAtCursor from "./handlers/log/onLogTypeAtCursor";

import onCompletion from "./handlers/lsp/onCompletion";
import onCompletionResolve from "./handlers/lsp/onCompletionResolve";
import onDefinition from "./handlers/lsp/onDefinition";
import onHover from "./handlers/lsp/onHover";

import registerCustomHandlers from "./utils/registerCustomHandlers";

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

setState({
    connection,
    documents,
    riotDocuments: new Map(),

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

registerCustomHandlers(
    connection,
    [
        onGetContentTypeAtCursor,
        onLogCompiledComponent,
        onLogContentTypeAtCursor,
        onLogDeclaration,
        onLogExpressionScopeFunction,
        onLogProgramFiles,
        onLogScriptContent,
        onLogSlots,
        onLogTypeAtCursor,
    ]
);

connection.onShutdown(onShutdown);

documents.listen(connection);
connection.listen();