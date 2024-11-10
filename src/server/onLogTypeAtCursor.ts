import scriptOffsetsMap from "./scriptOffsetsMap";
import touchRiotDocument from "./touchRiotDocument";

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

    const filePath = touchRiotDocument(document);
    const scriptOffset = scriptOffsetsMap.get(filePath)!;

    const info = tsLanguageService.getQuickInfoAtPosition(
        filePath, cursorPosition - scriptOffset
    );
    connection.console.log(`Type at ${cursorPosition}: ${
        // JSON.stringify(info, null, 2)
        info?.displayParts?.map(p => p.text).join('')
    }`);
}