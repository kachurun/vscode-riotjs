import getDocument from "../../core/getDocument";

import { getState } from "../../core/state";

import getContentTypeAtOffset from "../../features/riot/getContentTypeAtOffset";

import touchRiotDocument from "../../riot-documents/touch";

import uriToPath from "../../utils/document/uriToPath";

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
        connection
    } = getState();

    const document = getDocument(uri);
    if (!document) {
        connection.console.error(`Document "${uri}" not found`);
        return;
    }

    const riotDocument = touchRiotDocument(
        uriToPath(document.uri),
        () => document.getText()
    );
    if (riotDocument == null) {
        connection.console.error("Couldn't parse riot component");
        return;
    }

    const contentType = getContentTypeAtOffset(
        cursorPosition, riotDocument.getParserResult()
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