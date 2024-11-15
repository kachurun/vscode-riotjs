import ParserResult from "./riot-parser/ParserResult";
import isOffsetInNode from "./isOffsetInNode";

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