import {
    CompletionItem,
    CompletionList,
    CompletionParams,
    
} from "vscode-languageserver/node";
import { getState } from "./state";
import isInsideScript from "../utils/isInsideScript";
import getCompletionsAndScriptOffset from "./getCompletionAndScriptOffset";
import CompletionConverter from "../CompletionConverter";
import isInsideStyle from "../utils/isInsideStyle";

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

    try {
        if (
            isInsideScript(document, params.position)
            // || isInsideExpression(document, textDocumentPosition.position)
        ) {
            const { completions, scriptOffset } = getCompletionsAndScriptOffset({
                document, position: params.position,
                tsLanguageService, connection
            });

            // TODO: add scriptOffset to range of replacement

            return CompletionConverter.convert(completions);
        } else if (isInsideStyle(document, params.position)) {

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