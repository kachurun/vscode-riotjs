import findExpressionAtOffset from "../../utils/node/findExpressionAtOffset";
import isOffsetInNode from "../../utils/node/isOffsetInNode";

import ParserResult from "../../utils/riot-parser/ParserResult";

export default function getContentTypeAtOffset(
    offset: number,
    parsedDocument: ParserResult
) {
    const { output: { template, javascript, css } } = parsedDocument;
    if (!isOffsetInNode(offset, template)) {
        return null;
    }

    if (
        css != null && css.text != null &&
        isOffsetInNode(offset, css.text)
    ) {
        return "css";
    }
    if (
        javascript != null && javascript.text != null &&
        isOffsetInNode(offset, javascript.text)
    ) {
        return "javascript";
    }

    return (findExpressionAtOffset(offset, template) ?
        "expression" : "template"
    );
}