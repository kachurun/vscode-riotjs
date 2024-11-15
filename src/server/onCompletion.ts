import {
    CompletionItem,
    CompletionList,
    CompletionParams,
    
} from "vscode-languageserver/node";

import CompletionConverter from "../CompletionConverter";

import getCompletions from "./getCompletions";
import parsedRiotDocuments from "./parsedRiotDocuments";
import touchRiotDocument from "./touchRiotDocument";

import { getState } from "./state";

import getContentTypeAtOffset from "./utils/getContentTypeAtOffset";

export default async function onCompletion(
    params: CompletionParams
): Promise<(
    CompletionItem[] | CompletionList |
    undefined | null
)> {
    const {
        connection,
        documents,
        tsLanguageService,
        htmlLanguageService
    } = getState()

    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return null;
    }

    const filePath = touchRiotDocument(document);
    const parsedDocument = parsedRiotDocuments.get(filePath);
    if (parsedDocument == null) {
        return null;
    }

    const offset = document.offsetAt(params.position);

    try {
        const contentType = getContentTypeAtOffset(offset, parsedDocument);
        if (contentType == null) {
            return null;
        }

        switch (contentType) {
            case "javascript": {
                const completions = getCompletions({
                    document, position: params.position,
                    tsLanguageService, connection
                });

                // TODO: add script offset to range of replacement

                return CompletionConverter.convert(completions);
            }
            case "expression": {
                connection.console.log(
                    "Requested position is inside expression"
                );
                return null;
            }
            case "css": {
                // TODO: should extract content from style tag, and remap position after completions
                // connection.console.log("Requested position is inside style");
                // const parsedStylesheet = cssLanguageService.parseStylesheet(document);
                // const cssCompletions = cssLanguageService.doComplete(document, params.position, parsedStylesheet);
                return {
                    isIncomplete: false,
                    items: []
                };
            }
            case "template": {
                connection.console.log("Requested position is inside html");
                const htmlDocument = htmlLanguageService.parseHTMLDocument(document);
                const htmlCompletions = htmlLanguageService.doComplete(document, params.position, htmlDocument);
                return htmlCompletions;
            }
        }
    } catch (error) {
        connection.console.error(`Error in completion handler: ${error}`);
        connection.console.error(`Stack trace: ${error.stack}`);
        return {
            isIncomplete: false,
            items: []
        };
    }
}