import { TextDocumentChangeEvent } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";

import getDocumentFilePath from "./getDocumentFilePath";
import removeDocument from "./removeDocument";

import { getState } from "./state";

export default function onDidDocumentClose(
    event: TextDocumentChangeEvent<TextDocument>
) {
    getState().connection.console.log(
        `Document closed: "${event.document.uri}"`
    );
    removeDocument(getDocumentFilePath(event.document));
}