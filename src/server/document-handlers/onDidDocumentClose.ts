import { TextDocumentChangeEvent } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";

import { getState } from "../core/state";

import removeRiotDocument from "../riot-documents/remove";

import getDocumentFilePath from "../utils/getDocumentFilePath";

export default function onDidDocumentClose(
    event: TextDocumentChangeEvent<TextDocument>
) {
    getState().connection.console.log(
        `Document closed: "${event.document.uri}"`
    );
    removeRiotDocument(getDocumentFilePath(event.document));
}