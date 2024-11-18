import touchRiotDocument from "./touchRiotDocument";

import getDocumentFilePath from "./getDocumentFilePath";
import parsedRiotDocuments from "./parsedRiotDocuments";

import { getState } from "./state";

import getContentTypeAtOffset from "./utils/getContentTypeAtOffset";

namespace onLogContentTypeAtCursor {
    export type Args = {
        uri: string,
        cursorPosition: number
    };
}

export default async function onLogContentTypeAtCursor({
    uri, cursorPosition
}: onLogContentTypeAtCursor.Args) {
    const {
        connection,
        documents
    } = getState();

    const document = documents.get(uri);
    if (!document) {
        connection.console.error(`Document "${uri}" not found`);
        return;
    }

    const filePath = getDocumentFilePath(document);
    touchRiotDocument(filePath, () => document.getText());
    const parsedDocument = parsedRiotDocuments.get(filePath);

    if (parsedDocument == null) {
        connection.console.error("Couldn't parse riot component");
        return;
    }

    const contentType = getContentTypeAtOffset(
        cursorPosition, parsedDocument.result
    );
    if (contentType == null) {
        connection.console.error(
            `Couldn't determine content type at ${cursorPosition}`
        );
        return;
    }
    connection.console.log(
        `Content type at ${cursorPosition}: "${contentType}"`
    );
}