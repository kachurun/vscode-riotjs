import ParserNode from "./ParserNode";

type ParserCodeNode = Omit<ParserNode, "text" | "expressions" | "parts"> & {
    text: {
        type: 3,
        text: string,
        start: number,
        end: number
    }
};
export default ParserCodeNode;