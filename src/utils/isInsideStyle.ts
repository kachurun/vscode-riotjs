import { TextDocument } from "vscode-languageserver-textdocument";
import { Position } from "vscode-languageserver";

import isInsideTag from "./isInsideTag";

export default function isInsideStyle(
    document: Omit<TextDocument, "uri">,
    position: Position
) {
    return isInsideTag(document, position, "style");
}