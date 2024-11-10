import { TextDocument } from "vscode-languageserver-textdocument";
import { Position } from "vscode-languageserver";

import isInsideTag from "./isInsideTag";

export default function isInsideScript(
    document: Omit<TextDocument, "uri">,
    position: Position
) {
    return isInsideTag(document, position, "script");
}