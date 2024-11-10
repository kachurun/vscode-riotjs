import { TextDocument } from "vscode-languageserver-textdocument";
import {
    Position,
    createConnection
} from "vscode-languageserver/node";

import TypeScriptLanguageService from "../TypeScriptLanguageService";

import scriptOffsetsMap from "./scriptOffsetsMap";
import touchRiotDocument from "./touchRiotDocument";

namespace getCompletionsAndScriptOffset {
    export type Args = {
        document: TextDocument,
        position: Position,
        tsLanguageService: TypeScriptLanguageService | null,
        connection: ReturnType<typeof createConnection>
    };
}

export default function getCompletionsAndScriptOffset(
    {
        document, position,
        tsLanguageService,
        connection
    }: getCompletionsAndScriptOffset.Args
) {
    if (tsLanguageService == null) {
        connection.console.log("No Language Service");
        return {
            completions: undefined,
            scriptOffset: { line: 0, character: 0 }
        };
    }
    const filePath = touchRiotDocument(document);
    const scriptOffset = scriptOffsetsMap.get(filePath)!;

    if (scriptOffset < 0) {
        connection.console.log("No script content found");
        return {
            completions: undefined,
            scriptOffset: { line: 0, character: 0 }
        };
    }

    const adjustedRequestedOffset = (
        document.offsetAt(position) - scriptOffset
    );

    try {
        // connection.console.log(
        //     `${content.substring(
        //         Math.max(0, adjustedRequestedOffset - 100),
        //         adjustedRequestedOffset
        //     )}|${content.substring(
        //         adjustedRequestedOffset,
        //         adjustedRequestedOffset + 100
        //     )}`
        // );
        
        let completions = tsLanguageService.getCompletionsAtPosition(filePath, adjustedRequestedOffset);
        if (completions) {
            connection.console.log(`First 5 completions:\n${completions.entries.slice(0, 5).map(entry => JSON.stringify(entry, null, 2)).join("\n")}\n\n`);
        } else {
            connection.console.log(`No completions...`);
        }

        return {
            completions,
            scriptOffset
        };
    } catch (error) {
        connection.console.error(`Error in jsCompletion: ${error}`);
        connection.console.error(`Error stack: ${error.stack}`);
        return {
            completions: undefined,
            scriptOffset: { line: 0, character: 0 }
        };
    }
}