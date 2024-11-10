import {
    TextDocumentContentChangeEvent,
    TextEditor,
    Selection
} from "vscode";

const openingTagRegex = /<(\w+)(?:\s+[^>]*)?$/;

export default async function autoCloseTag(
    editor: TextEditor,
    change: TextDocumentContentChangeEvent
) {
    const { document } = editor;
    const position = change.range.end;

    const text = document.getText();
    const textBeforeCursor = text.substring(
        0, document.offsetAt(position)
    );

    if (textBeforeCursor.endsWith("/>")) {
        return;
    }

    const openingTagMatch = textBeforeCursor.match(openingTagRegex);
    if (openingTagMatch == null) {
        return;
    }
    const tagName = openingTagMatch[1];
    await editor.edit((editBuilder) => {
        editBuilder.insert(position, `></${tagName}`);
    });

    const newPosition = position.translate(0, 1);
    editor.selection = new Selection(newPosition, newPosition);
}