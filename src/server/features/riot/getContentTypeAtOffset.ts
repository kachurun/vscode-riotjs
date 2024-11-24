import findAttributeAtOffset from "../../utils/node/findAttributeAtOffset";
import findExpressionAtOffset from "../../utils/node/findExpressionAtOffset";
import findNodeAtOffset from "../../utils/node/findNodeAtOffset";
import isOffsetInNode from "../../utils/node/isOffsetInNode";

import ParserResult from "../../utils/riot-parser/ParserResult";

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