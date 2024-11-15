import BaseParserNode from "./BaseParserNode";
import Expression from "./Expression";

type ParserNode = BaseParserNode & {
    nodes?: Array<ParserNode>,

    isCustom?: true,

    text?: string,
    expressions?: Array<Expression>,
    parts?: Array<string>
};
export default ParserNode;