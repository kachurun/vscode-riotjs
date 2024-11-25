import {
    CompletionItem,
    CompletionList,
    CompletionParams
} from "vscode-languageserver/node";

import CompletionConverter from "../../../CompletionConverter";

import getDocument from "../../core/getDocument";

import touchRiotDocument from "../../core/riot-documents/touch";

import { getState } from "../../core/state";

import getExpressionCompletions from "../../features/lsp/getExpressionCompletions";
import getScriptCompletions from "../../features/lsp/getScriptCompletions";

import getContentTypeAtOffset from "../../features/riot/getContentTypeAtOffset";

import uriToPath from "../../utils/document/uriToPath";

export default async function onCompletion(
    params: CompletionParams
): Promise<(
    CompletionItem[] | CompletionList |
    undefined | null
)> {
    const {
        connection,
        tsLanguageService,
        htmlLanguageService
    } = getState()

    const document = getDocument(params.textDocument.uri);
    if (!document) {
        return null;
    }

    const filePath = uriToPath(document.uri);
    const riotDocument = touchRiotDocument(
        filePath, () => document.getText()
    );
    if (riotDocument == null) {
        return null;
    }

    const offset = document.offsetAt(params.position);

    try {
        const contentType = getContentTypeAtOffset(
            offset, riotDocument.getParserResult()
        );
        if (contentType == null) {
            return null;
        }

        switch (contentType) {
            case "javascript": {
                const completions = getScriptCompletions({
                    filePath,
                    getText: () => document.getText(),
                    offset,
                    tsLanguageService, connection
                });

                // TODO: add script offset to range of replacement

                return CompletionConverter.convert(completions);
            }
            case "expression": {
                const completions = getExpressionCompletions({
                    filePath,
                    getText: () => document.getText(),
                    offset,
                    tsLanguageService, connection
                });

                // TODO: add script offset to range of replacement

                return CompletionConverter.convert(completions);
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