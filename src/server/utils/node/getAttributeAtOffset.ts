import ParserNode from "../riot-parser/ParserNode";

import isOffsetInNode from "./isOffsetInNode";

export default function getAttributeAtOffset(
    offset: number, node: ParserNode
) {
    if (node.attributes == null || node.attributes.length === 0) {
        return null;
    }

    return node.attributes.find(
        (attr) => isOffsetInNode(offset, attr)
    ) || null;
}