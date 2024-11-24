import getDocument from "../core/getDocument";

import { getState } from "../core/state";

import touchRiotDocument from "../riot-documents/touch";

import getContentTypeAtOffset from "../utils/getContentTypeAtOffset";
import getDocumentFilePath from "../utils/getDocumentFilePath";

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
        connection
    } = getState();

    const document = getDocument(uri);
    if (document == null) {
        connection.console.error(`Document "${uri}" not found`);
        return null;
    }

    const filePath = getDocumentFilePath(document);
    const riotDocument = touchRiotDocument(filePath, () => document.getText());
    if (riotDocument == null) {
        connection.console.error("Couldn't parse riot component");
        return null;
    }

    return getContentTypeAtOffset(
        cursorPosition, riotDocument.getParserResult()
    );
}