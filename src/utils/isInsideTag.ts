import { Position } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";

export default function isInsideTag(
    document: Omit<TextDocument, "uri">,
    position: Position,
    tag: string
) {
    const text = document.getText();
    const offset = document.offsetAt(position);
    const beforeCursor = text.slice(0, offset);

    const tagOpeningRegex = new RegExp(`<${tag}(?:\\s[^>]*)?>`, "gi");
    const tagClosingRegex = new RegExp(`<\/${tag}>`, "gi");

    let tagStart = -1;
    let match;

    while ((match = tagOpeningRegex.exec(beforeCursor)) !== null) {
        tagStart = match.index + match[0].length;
    }

    if (tagStart === -1) return false;

    const afterTagStart = text.slice(tagStart);
    const tagEnd = afterTagStart.search(tagClosingRegex);

    return tagEnd === -1 || offset < tagStart + tagEnd;
}