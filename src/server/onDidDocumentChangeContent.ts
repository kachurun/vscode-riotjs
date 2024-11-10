import { TextDocument } from "vscode-languageserver-textdocument";
import {
    TextDocumentChangeEvent
} from "vscode-languageserver/node";

import updateRiotDocument from "./updateRiotDocument";

import { getState } from "./state";

export default function onDidDocumentChangeContent(
    event: TextDocumentChangeEvent<TextDocument>
) {
    getState().connection.console.log(
        `Document has changed: ${event.document.uri}`
    );
    updateRiotDocument(event.document);
}