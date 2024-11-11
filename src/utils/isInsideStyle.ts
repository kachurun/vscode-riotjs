import { TextDocument } from "vscode-languageserver-textdocument";
import { Position } from "vscode-languageserver";

import isInsideTag from "./isInsideTag";

import ParserResult from "./riot-parser/ParserResult";

export default function isInsideStyle(
    document: Omit<TextDocument, "uri">,
    position: Position,
    parsedDocument: ParserResult["output"] | null
) {
    if (parsedDocument == null) {
        return isInsideTag(
            document, position, "style"
        );
    }

    if (parsedDocument.css == null) {
        return false;
    }

    const offset = document.offsetAt(position);
    return (
        offset >= parsedDocument.css.text.start &&
        offset < parsedDocument.css.text.end
    );
}