import ParserCodeNode from "./ParserCodeNode";
import ParserNode from "./ParserNode";

type ParserResult = {
    data: string,
    output: {
        template: ParserNode,
        css: ParserCodeNode | null,
        javascript: ParserCodeNode | null,
    }
};
export default ParserResult;