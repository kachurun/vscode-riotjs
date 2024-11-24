import { TextDocument } from "vscode-languageserver-textdocument";
import {
    TextDocumentChangeEvent
} from "vscode-languageserver/node";

import updateRiotDocument from "../../riot-documents/update";

import uriToPath from "../../utils/document/uriToPath";

export default function onDidDocumentChangeContent(
    event: TextDocumentChangeEvent<TextDocument>
) {
    updateRiotDocument(
        uriToPath(event.document.uri),
        event.document.getText()
    );
}