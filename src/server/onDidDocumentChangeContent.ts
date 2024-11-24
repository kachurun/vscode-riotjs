import { TextDocument } from "vscode-languageserver-textdocument";
import {
    TextDocumentChangeEvent
} from "vscode-languageserver/node";

import getDocumentFilePath from "./getDocumentFilePath";

import updateRiotDocument from "./riotDocuments/update";

export default function onDidDocumentChangeContent(
    event: TextDocumentChangeEvent<TextDocument>
) {
    updateRiotDocument(
        getDocumentFilePath(event.document),
        event.document.getText()
    );
}