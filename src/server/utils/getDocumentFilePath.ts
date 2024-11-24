import { TextDocument } from "vscode-languageserver-textdocument";

export default function getDocumentFilePath(document: TextDocument) {
    const url = new URL(document.uri);
    return decodeURIComponent(
        (url.pathname.startsWith("/") ?
            url.pathname.slice(1) : url.pathname
        )
    );
}