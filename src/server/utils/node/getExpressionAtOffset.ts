import Expression from "../riot-parser/Expression";

import isOffsetInNode from "./isOffsetInNode";

export default function getExpressionAtOffset(
    offset, expressions: Array<Expression>
) {
    return expressions.find(expression => {
        // `offset` should not be equal to `start`
        // to ensure it is inside the brackets
        return isOffsetInNode(offset, expression, false);
    }) || null;
}