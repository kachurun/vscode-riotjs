import BaseParserNode from "../riot-parser/BaseParserNode";

import walk from "./walk";

export default function extractSlotNodes(
    baseNode: BaseParserNode
) {
    const slots: Array<{
        name: string,
        props: Record<string, any>,
        start: number,
        end: number
    }> = [];
    walk(baseNode, node => {
        if (node.name !== "slot") {
            return;
        }
        const props: Record<string, any> = {};
        let name = "default";
        node.attributes?.forEach(attr => {
            if (attr.name === "name") {
                name = attr.value;
                return;
            }
            props[attr.name] = attr.value;
        });
        slots.push({
            name,
            props,
            start: node.start,
            end: node.end
        });
    });

    return slots;
}