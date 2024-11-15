import findAttributeAtOffset from "./findAttributeAtOffset";
import findExpressionAtOffset from "./findExpressionAtOffset";
import findNodeAtOffset from "./findNodeAtOffset";
import isOffsetInNode from "./isOffsetInNode";

import ParserResult from "./riot-parser/ParserResult";

export default function getContentTypeAtOffset(
    offset: number,
    parsedDocument: ParserResult
) {
    const { output: { template, javascript, css } } = parsedDocument;
    if (!isOffsetInNode(offset, template)) {
        return null;
    }

    if (
        css != null && css.text != null &&
        isOffsetInNode(offset, css.text)
    ) {
        return "css";
    }
    if (
        javascript != null && javascript.text != null &&
        isOffsetInNode(offset, javascript.text)
    ) {
        return "javascript";
    }

    const node = findNodeAtOffset(offset, template);

    const attributeAtOffset = findAttributeAtOffset(offset, node);
    if (attributeAtOffset != null) {
        return findExpressionAtOffset(
            offset, attributeAtOffset.expressions || []
        ) != null ? "expression" : "template";
    }

    return findExpressionAtOffset(
        offset, node.expressions || []
    ) != null ? "expression" : "template";
}