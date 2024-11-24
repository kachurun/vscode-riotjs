import isOffsetInNode from "./isOffsetInNode";

import Expression from "../riot-parser/Expression";

export default function findExpressionAtOffset(
    offset: number, expressions: Array<Expression>
) {
    return expressions.find(expression => {
        // `offset` should not be equal to `start`
        // to ensure it is inside the brackets
        return isOffsetInNode(offset, expression, false);
    }) || null;
}