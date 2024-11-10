import updateRiotDocument from "./updateRiotDocument";

import { getState } from "./state";

namespace onLogTypeAtCursor {
    export type Args = {
        uri: string,
        cursorPosition: number
    };
}

export default async function onLogTypeAtCursor({
    uri, cursorPosition
}: onLogTypeAtCursor.Args) {
    const {
        connection,
        documents,
        tsLanguageService
    } = getState();

    const document = documents.get(uri);
    if (!document) {
        connection.console.log(`Document "${uri}" not found`);
        return;
    }

    const url = new URL(document.uri);
    const filePath = decodeURIComponent(url.pathname.startsWith("/") ?
        url.pathname.slice(1) : url.pathname
    );

    connection.console.log(JSON.stringify({
        uri,
        filePath,
        cursorPosition
    }, null, 2));

    const { scriptOffset } = updateRiotDocument(
        document, tsLanguageService
    );

    const info = tsLanguageService.getQuickInfoAtPosition(
        filePath, cursorPosition - scriptOffset
    );
    connection.console.log(`Type at ${cursorPosition}: ${
        // JSON.stringify(info, null, 2)
        info?.displayParts?.map(p => p.text).join('')
    }`);
}