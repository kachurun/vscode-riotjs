import { TextDocument } from "vscode-languageserver-textdocument";
import { Position } from "vscode-languageserver";

export default function isInsideExpression(
    document: TextDocument,
    position: Position
) {
    const text = document.getText();
    const offset = document.offsetAt(position);
    const beforeCursor = text.slice(0, offset);
    
    const expressionMatch = beforeCursor.match(/\{[^}]*$/);
    
    return !!expressionMatch;
}