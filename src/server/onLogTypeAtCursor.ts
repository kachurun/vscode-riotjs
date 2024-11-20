import getDocument from "./getDocument";
import getDocumentFilePath from "./getDocumentFilePath";
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
        tsLanguageService
    } = getState();

    const document = getDocument(uri);
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

    const { result: parserResult } = parsedDocument;

    if (parserResult.output.javascript == null) {
        connection.console.error("<script> tag not found");
        return;
    }

    const contentType = getContentTypeAtOffset(
        cursorPosition, parserResult
    );
    if (contentType !== "javascript") {
        connection.console.error("Cursor not in <script> tag");
        return;
    }

    const info = tsLanguageService.getQuickInfoAtPosition(
        filePath,
        cursorPosition - parserResult.output.javascript.text!.start
    );
    connection.console.log(`Type at ${cursorPosition}: ${
        // JSON.stringify(info, null, 2)
        info?.displayParts?.map(p => p.text).join('')
    }`);
}