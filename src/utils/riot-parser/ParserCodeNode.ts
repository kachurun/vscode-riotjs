import BaseParserNode from "./BaseParserNode";

type ParserCodeNode = BaseParserNode & {
    text: {
        type: 3,
        text: string,
        start: number,
        end: number
    }
};
export default ParserCodeNode;