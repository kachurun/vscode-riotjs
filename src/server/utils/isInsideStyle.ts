import isOffsetInNode from "./isOffsetInNode";

import ParserResult from "./riot-parser/ParserResult";

export default function isInsideStyle(
    offset: number,
    parsedDocument: ParserResult
) {
    const { output: { css } } = parsedDocument;
    if (css == null || css.text == null) {
        return false;
    }

    return isOffsetInNode(offset, css.text);
}