import { createConnection } from "vscode-languageserver/node";

import TypeScriptLanguageService from "../../../TypeScriptLanguageService";

import touchRiotDocument from "../../core/riot-documents/touch";

namespace getScriptCompletions {
    export type Args = {
        filePath: string,
        getText: () => string,
        offset: number,
        tsLanguageService: TypeScriptLanguageService | null,
        connection: ReturnType<typeof createConnection>
    };
}

function getScriptCompletions(
    {
        filePath,
        getText,
        offset,
        tsLanguageService,
        connection
    }: getScriptCompletions.Args
) {
    if (tsLanguageService == null) {
        connection.console.log("No Language Service");
        return null;
    }
    const riotDocument = touchRiotDocument(filePath, getText);
    if (riotDocument == null) {
        connection.console.error("No script content found");
        return null;
    }

    const parserResult = riotDocument.getParserResult();
    if (
        parserResult.output.javascript == null ||
        parserResult.output.javascript.text == null
    ) {
        connection.console.error("No script content found");
        return null;
    }

    const adjustedRequestedOffset = (
        offset - parserResult.output.javascript.text.start
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

export default getScriptCompletions;