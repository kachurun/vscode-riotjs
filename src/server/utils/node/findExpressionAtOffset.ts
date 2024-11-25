import ParserNode from "../riot-parser/ParserNode";

import findNodeAtOffset from "./findNodeAtOffset";
import getAttributeAtOffset from "./getAttributeAtOffset";
import getExpressionAtOffset from "./getExpressionAtOffset";

export default function findExpressionAtOffset(
    offset: number, startingNode: ParserNode
) {
    const node = findNodeAtOffset(offset, startingNode);

    const attributeAtOffset = getAttributeAtOffset(offset, node);
    if (attributeAtOffset != null) {
        return getExpressionAtOffset(
            offset, attributeAtOffset.expressions || []
        );
    }

    return getExpressionAtOffset(
        offset, node.expressions || []
    );
}