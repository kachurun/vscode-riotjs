import ts from "typescript";

import { createConnection } from "vscode-languageserver/node";

import TypeScriptLanguageService from "../../../TypeScriptLanguageService";

import touchRiotDocument from "../../core/riot-documents/touch";

import findExpressionAtOffset from "../../utils/node/findExpressionAtOffset";

import getScopePropertiesAtOffset from "../../utils/riot/getScopePropertiesAtOffset";
import constructExpressionScopeFunction from "../../utils/riot/constructExpressionScopeFunction";

namespace getExpressionCompletions {
    export type Args = {
        filePath: string,
        getText: () => string,
        offset: number,
        tsLanguageService: TypeScriptLanguageService,
        connection: ReturnType<typeof createConnection>
    };
}

function getExpressionCompletions({
    filePath,
    getText,
    offset,
    tsLanguageService,
    connection
}: getExpressionCompletions.Args): ts.WithMetadata<ts.CompletionInfo> | null {
    const riotDocument = touchRiotDocument(filePath, getText);
    if (riotDocument == null) {
        return null;
    }

    const expressionNode = findExpressionAtOffset(
        offset, riotDocument.getParserResult().output.template
    );
    if (expressionNode == null) {
        return null;
    }

    const properties = getScopePropertiesAtOffset(
        riotDocument, offset,
        tsLanguageService
    );

    const offsetRelativeToExpression = offset - expressionNode.start;


    const {
        constructedFunction,
        expressionIndex
    } = constructExpressionScopeFunction(
        expressionNode, properties
    );

    const finalOffset = offsetRelativeToExpression + expressionIndex;

    const expressionFileName = `${riotDocument.filePath}#expression:${expressionNode.start}`;
    tsLanguageService.updateDocument(
        expressionFileName, constructedFunction
    );
    return tsLanguageService.getCompletionsAtPosition(
        expressionFileName, finalOffset
    ) || null;
}

export default getExpressionCompletions;