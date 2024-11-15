import parsedRiotDocuments from "./parsedRiotDocuments";
import touchRiotDocument from "./touchRiotDocument";

import { getState } from "./state";

import getContentTypeAtOffset from "./utils/getContentTypeAtOffset";

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
    const parsedDocument = parsedRiotDocuments.get(filePath);

    if (parsedDocument == null) {
        connection.console.log("Couldn't parse riot component");
        return;
    }

    if (parsedDocument.output.javascript == null) {
        connection.console.log("<script> tag not found");
        return;
    }

    const contentType = getContentTypeAtOffset(
        cursorPosition, parsedDocument
    );
    if (contentType !== "javascript") {
        connection.console.log("Cursor not in <script> tag");
        return;
    }

    const info = tsLanguageService.getQuickInfoAtPosition(
        filePath,
        cursorPosition - parsedDocument.output.javascript.text!.start
    );
    connection.console.log(`Type at ${cursorPosition}: ${
        // JSON.stringify(info, null, 2)
        info?.displayParts?.map(p => p.text).join('')
    }`);
}