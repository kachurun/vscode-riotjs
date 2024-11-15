import touchRiotDocument from "./touchRiotDocument";

import parsedRiotDocuments from "./parsedRiotDocuments";

import { getState } from "./state";

import getContentTypeAtOffset from "./utils/getContentTypeAtOffset";

namespace onGetContentTypeAtCursor {
    export type Args = {
        uri: string,
        cursorPosition: number
    };
}

export default async function onGetContentTypeAtCursor({
    uri, cursorPosition
}: onGetContentTypeAtCursor.Args) {
    const {
        connection,
        documents
    } = getState();

    const document = documents.get(uri);
    if (!document) {
        connection.console.log(`Document "${uri}" not found`);
        return null;
    }

    const filePath = touchRiotDocument(document);
    const parsedDocument = parsedRiotDocuments.get(filePath);

    if (parsedDocument == null) {
        connection.console.log("Couldn't parse riot component");
        return null;
    }

    return getContentTypeAtOffset(
        cursorPosition, parsedDocument
    );
}