import ParserNode from "../riot-parser/ParserNode";

import isOffsetInNode from "./isOffsetInNode";
import isTagNode from "./isTagNode";
import walk from "./walk";

export default function getScopeComponentsNamesAtOffset(
    offset: number,
    startingNode: ParserNode
) {
    const scopeComponents: Array<string> = [];
    walk(
        startingNode,
        (node) => {
            if (node === startingNode) {
                return false;
            }
            if (node.start >= offset) {
                return true;
            }
            if (!isOffsetInNode(offset, node)) {
                return false;
            }

            if (isTagNode(node) && node.isCustom) {
                // should consider also the "is" attr!!
                scopeComponents.push(node.name);
            }
        },
        true
    );

    return scopeComponents;
}