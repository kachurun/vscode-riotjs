import Attribute from "./Attribute";

type BaseParserNode = {
    type: number,
    name: string,

    start: number,
    end: number,

    attributes?: Array<Attribute>,

    isVoid?: true,
    isSelfClosing?: true
};
export default BaseParserNode;