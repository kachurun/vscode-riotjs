import getDocumentFilePath from "./getDocumentFilePath";
import parsedRiotDocuments from "./parsedRiotDocuments";
import touchRiotDocument from "./touchRiotDocument";

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
        connection.console.error(`Document "${uri}" not found`);
        return null;
    }

    const filePath = getDocumentFilePath(document);
    touchRiotDocument(filePath, () => document.getText());
    const parsedDocument = parsedRiotDocuments.get(filePath);

    if (parsedDocument == null) {
        connection.console.error("Couldn't parse riot component");
        return null;
    }

    return getContentTypeAtOffset(
        cursorPosition, parsedDocument.result
    );
}