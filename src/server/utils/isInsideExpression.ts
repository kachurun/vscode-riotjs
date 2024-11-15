import findAttributeAtOffset from "./findAttributeAtOffset";
import findExpressionAtOffset from "./findExpressionAtOffset";
import findNodeAtOffset from "./findNodeAtOffset";
import isOffsetInNode from "./isOffsetInNode";

import ParserResult from "./riot-parser/ParserResult";

export default function isInsideExpression(
    offset: number,
    parsedDocument: ParserResult
) {
    const { output: { template, javascript, css } } = parsedDocument;
    if (!isOffsetInNode(offset, template)) {
        return false;
    }

    if (css != null && isOffsetInNode(offset, css)) {
        return false;
    }
    if (javascript != null && isOffsetInNode(offset, javascript)) {
        return false;
    }

    const node = findNodeAtOffset(offset, template);

    const attributeAtOffset = findAttributeAtOffset(offset, node);
    if (attributeAtOffset != null) {
        return findExpressionAtOffset(
            offset, attributeAtOffset.expressions || []
        ) != null;
    }

    return findExpressionAtOffset(
        offset, node.expressions || []
    ) != null;
}