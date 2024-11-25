import BaseParserNode from "../riot-parser/BaseParserNode";
import ParserNode from "../riot-parser/ParserNode";

export default function isTagNode(
    node: BaseParserNode
): node is ParserNode {
    return node.type === 1;
}