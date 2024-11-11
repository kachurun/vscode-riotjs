import Attribute from "./Attribute";
import Expression from "./Expression";

type ParserNode = {
    type: number,
    name: string,

    start: number,
    end: number,

    nodes?: Array<ParserNode>,
    attributes?: Array<Attribute>,

    isCustom?: true,
    isVoid?: true,
    isSelfClosing?: true,

    text?: string,
    expressions?: Array<Expression>,
    parts?: Array<string>
};
export default ParserNode;