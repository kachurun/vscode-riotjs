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

    /**
     * should probably request to the server
     * if the change was made inside
     * script or style tags
     */
    const change = event.contentChanges[0];
    if (
        change.text === ">" &&
        !isInsideScript(editor.document, change.range.start, null) &&
        !isInsideStyle(editor.document, change.range.start, null)
    ) {
        await autoCloseTag(editor, change);
    }
}