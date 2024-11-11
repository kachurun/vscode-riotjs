import {
    CompletionItem,
    CompletionList,
    CompletionParams,
    
} from "vscode-languageserver/node";

import CompletionConverter from "../CompletionConverter";

import isInsideExpression from "../utils/isInsideExpression";
import isInsideScript from "../utils/isInsideScript";
import isInsideStyle from "../utils/isInsideStyle";

import getCompletions from "./getCompletions";
import parsedRiotDocuments from "./parsedRiotDocuments";
import touchRiotDocument from "./touchRiotDocument";

import { getState } from "./state";

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
        return [];
    }

    const filePath = touchRiotDocument(document);
    const parsedDocument = parsedRiotDocuments.get(filePath);

    try {
        if (
            isInsideScript(
                document, params.position,
                parsedDocument?.output || null
            )
        ) {
            const completions = getCompletions({
                document, position: params.position,
                tsLanguageService, connection
            });

            // TODO: add script offset to range of replacement

            return CompletionConverter.convert(completions);
        } else if (
            isInsideExpression(
                document, params.position,
                parsedDocument?.output || null
            )
        ) {
            connection.console.log("Requested position is inside expression");
            return null;
        } else if (
            isInsideStyle(
                document, params.position,
                parsedDocument?.output || null
            )
        ) {

            // TODO: should extract content from style tag, and remap position after completions
            // connection.console.log("Requested position is inside style");
            // const parsedStylesheet = cssLanguageService.parseStylesheet(document);
            // const cssCompletions = cssLanguageService.doComplete(document, params.position, parsedStylesheet);
            return {
                isIncomplete: false,
                items: []
            };
        } else {
            connection.console.log("Requested position is inside html");
            const htmlDocument = htmlLanguageService.parseHTMLDocument(document);
            const htmlCompletions = htmlLanguageService.doComplete(document, params.position, htmlDocument);
            return htmlCompletions;
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