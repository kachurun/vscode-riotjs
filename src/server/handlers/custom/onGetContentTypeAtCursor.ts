import getDocument from "../../core/getDocument";

import { getState } from "../../core/state";

import getContentTypeAtOffset from "../../features/riot/getContentTypeAtOffset";

import touchRiotDocument from "../../riot-documents/touch";

import uriToPath from "../../utils/document/uriToPath";

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

    const riotDocument = touchRiotDocument(
        uriToPath(document.uri),
        () => document.getText()
    );
    if (riotDocument == null) {
        connection.console.error("Couldn't parse riot component");
        return null;
    }

    return getContentTypeAtOffset(
        cursorPosition, riotDocument.getParserResult()
    );
}