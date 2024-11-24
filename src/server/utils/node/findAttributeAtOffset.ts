import isOffsetInNode from "./isOffsetInNode";

import ParserNode from "../riot-parser/ParserNode";

export default function findAttributeAtOffset(
    offset: number, node: ParserNode
) {
    if (node.attributes == null || node.attributes.length === 0) {
        return null;
    }

    return node.attributes.find(
        (attr) => isOffsetInNode(offset, attr)
    ) || null;
}