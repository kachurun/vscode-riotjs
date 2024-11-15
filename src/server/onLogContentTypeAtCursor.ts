import touchRiotDocument from "./touchRiotDocument";

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
        connection.console.log(`Document "${uri}" not found`);
        return;
    }

    const filePath = touchRiotDocument(document);
    const parsedDocument = parsedRiotDocuments.get(filePath);

    if (parsedDocument == null) {
        connection.console.log("Couldn't parse riot component");
        return;
    }

    const contentType = getContentTypeAtOffset(
        cursorPosition, parsedDocument
    );
    if (contentType == null) {
        connection.console.log(
            `Couldn't determine content type at ${cursorPosition}`
        );
        return;
    }
    connection.console.log(
        `Content type at ${cursorPosition}: "${contentType}"`
    );
}