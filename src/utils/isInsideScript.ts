import { TextDocument } from "vscode-languageserver-textdocument";
import { Position } from "vscode-languageserver";

import isInsideTag from "./isInsideTag";

import ParserResult from "./riot-parser/ParserResult";

export default function isInsideScript(
    document: Omit<TextDocument, "uri">,
    position: Position,
    parsedDocument: ParserResult["output"] | null
) {
    if (parsedDocument == null) {
        return isInsideTag(
            document, position, "script"
        );
    }

    if (parsedDocument.javascript == null) {
        return false;
    }

    const offset = document.offsetAt(position);
    return (
        offset >= parsedDocument.javascript.text.start &&
        offset < parsedDocument.javascript.text.end
    );
}