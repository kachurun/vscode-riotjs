import BaseParserNode from "../riot-parser/BaseParserNode";

import isTagNode from "./isTagNode";

export default function walk(
    node: BaseParserNode,
    onNode: (node: BaseParserNode) => void,
    untilTrue = false
) {
    const result = onNode(node);
    if (untilTrue && result) {
        return;
    }
    if (!isTagNode(node)) {
        return false;
    }
    return node.nodes?.some(node => {
        const result = walk(node, onNode);
        return untilTrue && result;
    }) || false;
}