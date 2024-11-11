import isOffsetInNode from "./isOffsetInNode";
import ParserNode from "./riot-parser/ParserNode";

export default function findNodeAtOffset(
    offset: number, node: ParserNode
) {
    for (
        let index = 0;
        index < (node.nodes?.length || 0);
        index++
    ) {
        const childNode = node.nodes![index];
        if (!isOffsetInNode(offset, childNode)) {
            continue;
        }

        return findNodeAtOffset(offset, childNode);
    }

    return node;
}