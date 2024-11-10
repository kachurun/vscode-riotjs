import {
    TextDocumentChangeEvent,
    window
} from "vscode";
import autoCloseTag from "./autoCloseTag";
import isInsideScript from "../utils/isInsideScript";
import isInsideStyle from "../utils/isInsideStyle";

export default async function onDidChangeTextDocument(
    event: TextDocumentChangeEvent
) {
    if (event.contentChanges.length === 0) return;

    const editor = window.activeTextEditor;
    if (!editor || editor.document !== event.document || editor.document.languageId !== "riotjs") {
        return;
    }

    const change = event.contentChanges[0];
    if (
        change.text === ">" &&
        !isInsideScript(editor.document, change.range.start) &&
        !isInsideStyle(editor.document, change.range.start)
    ) {
        await autoCloseTag(editor, change);
    }
}