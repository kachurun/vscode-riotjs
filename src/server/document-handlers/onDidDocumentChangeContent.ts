import { TextDocument } from "vscode-languageserver-textdocument";
import {
    TextDocumentChangeEvent
} from "vscode-languageserver/node";

import updateRiotDocument from "../riot-documents/update";

import getDocumentFilePath from "../utils/getDocumentFilePath";

export default function onDidDocumentChangeContent(
    event: TextDocumentChangeEvent<TextDocument>
) {
    updateRiotDocument(
        getDocumentFilePath(event.document),
        event.document.getText()
    );
}