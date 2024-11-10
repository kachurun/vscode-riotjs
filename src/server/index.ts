import {
    createConnection,
    TextDocuments,
    ProposedFeatures
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { getLanguageService as getHTMLLanguageService } from "vscode-html-languageservice";
import { getCSSLanguageService } from "vscode-css-languageservice";

import TypeScriptLanguageService from "../TypeScriptLanguageService";

import onCompletion from "./onCompletion";
import onCompletionResolve from "./onCompletionResolve";
import onDefinition from "./onDefinition";
import onDidDocumentChangeContent from "./OnDidDocumentChangeContent";
import onHover from "./onHover";
import onInitialize from "./onInitialize";
import onLogProgramFiles from "./onLogProgramFiles";
import onLogScriptContent from "./onLogScriptContent";
import onLogTypeAtCursor from "./onLogTypeAtCursor";
import onShutdown from "./onShutdown";

import { setState } from "./state";

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

setState({
    connection,
    documents,

    tsLanguageService: new TypeScriptLanguageService(),
    htmlLanguageService: getHTMLLanguageService(),
    cssLanguageService: getCSSLanguageService(),

    hasConfigurationCapability: false,
    hasWorkspaceFolderCapability: false,
    hasDiagnosticRelatedInformationCapability: false
});

connection.onInitialize(onInitialize);

documents.onDidChangeContent(onDidDocumentChangeContent);

connection.onCompletion(onCompletion);

connection.onCompletionResolve(onCompletionResolve);

connection.onHover(onHover);

connection.onDefinition(onDefinition);

connection.onRequest(
    "custom/logProgramFiles",
    onLogProgramFiles
);
connection.onRequest(
    "custom/logTypeAtCursor",
    onLogTypeAtCursor
);
connection.onRequest(
    "custom/logScriptContent",
    onLogScriptContent
);

connection.onShutdown(onShutdown);

documents.listen(connection);
connection.listen();