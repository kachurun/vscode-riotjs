import Expression from "./Expression";

type Attribute = {
    name: string,
    value: string,

    start: number,
    end: number,

    unescape?: string,
    expressions?: Array<Expression>,

    valueStart?: number,
    parts?: Array<string>
};
export default Attribute;