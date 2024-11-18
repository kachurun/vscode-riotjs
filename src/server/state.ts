import { TextDocument } from "vscode-languageserver-textdocument";
import { createConnection, TextDocuments } from "vscode-languageserver/node"
import {
    LanguageService as HTMLLanguageService
} from "vscode-html-languageservice";
import {
    LanguageService as CSSLanguageService
} from "vscode-css-languageservice";

import TypeScriptLanguageService from "../TypeScriptLanguageService";

type State = {
    connection: ReturnType<typeof createConnection>,

    documents: TextDocuments<TextDocument>,

    tsLanguageService: TypeScriptLanguageService,
    htmlLanguageService: HTMLLanguageService,
    cssLanguageService: CSSLanguageService,
    hasConfigurationCapability: boolean,
    hasWorkspaceFolderCapability: boolean,
    hasDiagnosticRelatedInformationCapability: boolean
};

let sharedState: State | null = null;

export function setState(state: State) {
    if (sharedState != null) {
        throw new Error("State already initialized");
    }
    sharedState = state;
}
export function getState(): State {
    if (sharedState == null) {
        throw new Error("State is not yet initialized");
    }
    return sharedState;
}