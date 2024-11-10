import {
    InitializeParams,
    InitializeResult,
    TextDocumentSyncKind
} from "vscode-languageserver/node";
import { getState } from "./state";

export default function onInitialize(
    params: InitializeParams
): InitializeResult {
    const state = getState();
    state.connection.console.log("Initializing Language Server");

    const { capabilities } = params;

    state.hasConfigurationCapability = !!(
        capabilities.workspace &&
        !!capabilities.workspace.configuration
    );
    state.hasWorkspaceFolderCapability = !!(
        capabilities.workspace &&
        !!capabilities.workspace.workspaceFolders
    );
    state.hasDiagnosticRelatedInformationCapability = !!(
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
}