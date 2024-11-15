import { TextDocument } from "vscode-languageserver-textdocument";
import {
    Position,
    createConnection
} from "vscode-languageserver/node";

import TypeScriptLanguageService from "../TypeScriptLanguageService";

import touchRiotDocument from "./touchRiotDocument";
import parsedRiotDocuments from "./parsedRiotDocuments";

namespace getCompletions {
    export type Args = {
        document: TextDocument,
        position: Position,
        tsLanguageService: TypeScriptLanguageService | null,
        connection: ReturnType<typeof createConnection>
    };
}

export default function getCompletions(
    {
        document, position,
        tsLanguageService,
        connection
    }: getCompletions.Args
) {
    if (tsLanguageService == null) {
        connection.console.log("No Language Service");
        return null;
    }
    const filePath = touchRiotDocument(document);
    const parsedDocument = parsedRiotDocuments.get(filePath);

    if (
        parsedDocument == null ||
        parsedDocument.output.javascript == null ||
        parsedDocument.output.javascript.text == null
    ) {
        connection.console.log("No script content found");
        return null;
    }

    const adjustedRequestedOffset = (
        document.offsetAt(position) -
        parsedDocument.output.javascript.text.start
    );

    try {
        let completions = tsLanguageService.getCompletionsAtPosition(filePath, adjustedRequestedOffset);

        return completions || null;
    } catch (error) {
        connection.console.error(`Error in jsCompletion: ${error}`);
        connection.console.error(`Error stack: ${error.stack}`);
        return null;
    }
}