import getDocument from "../../core/getDocument";

import touchRiotDocument from "../../core/riot-documents/touch";

import { getState } from "../../core/state";

import getContentTypeAtOffset from "../../features/riot/getContentTypeAtOffset";

import uriToPath from "../../utils/document/uriToPath";
import findExpressionAtOffset from "../../utils/node/findExpressionAtOffset";
import constructExpressionScopeFunction from "../../utils/riot/constructExpressionScopeFunction";
import getScopePropertiesAtOffset from "../../utils/riot/getScopePropertiesAtOffset";

namespace onLogExpressionScopeFunction {
    export type Args = {
        uri: string,
        cursorPosition: number
    };
}

export default async function onLogExpressionScopeFunction({
    uri, cursorPosition
}: onLogExpressionScopeFunction.Args) {
    const {
        connection,
        tsLanguageService
    } = getState();

    const document = getDocument(uri);
    if (!document) {
        connection.console.error(`Document "${uri}" not found`);
        return;
    }

    const filePath = uriToPath(document.uri);
    const riotDocument = touchRiotDocument(
        filePath, () => document.getText()
    );
    if (riotDocument == null) {
        connection.console.error("Couldn't parse document as component");
        return null;
    }

    const expressionNode = findExpressionAtOffset(
        cursorPosition, riotDocument.getParserResult().output.template
    );
    if (expressionNode == null) {
        connection.console.error("Cursor is not inside an expression");
        return null;
    }

    const properties = getScopePropertiesAtOffset(
        riotDocument, cursorPosition,
        tsLanguageService
    );

    const {
        constructedFunction
    } = constructExpressionScopeFunction(
        expressionNode, properties
    );

    const expressionFileName = `${riotDocument.filePath}#expression:${expressionNode.start}`;

    connection.console.log(`${expressionFileName}:\n\`\`\`\n${constructedFunction}\n\`\`\``);
}