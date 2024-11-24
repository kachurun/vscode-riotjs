import { TextDocumentChangeEvent } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";

import getDocumentFilePath from "./getDocumentFilePath";

import { getState } from "./state";

import removeRiotDocument from "./riot-documents/remove";

export default function onDidDocumentClose(
    event: TextDocumentChangeEvent<TextDocument>
) {
    getState().connection.console.log(
        `Document closed: "${event.document.uri}"`
    );
    removeRiotDocument(getDocumentFilePath(event.document));
}