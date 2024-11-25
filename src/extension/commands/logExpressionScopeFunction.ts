import { window } from "vscode";

import state from "../state";

export default async function logExpressionScopeFunction() {
    const editor = window.activeTextEditor;
    if (!editor || editor.document.languageId !== "riotjs") {
        return;
    }

    if (!state.riotClient) {
        window.showErrorMessage("Riot Language Server is not running");
        return;
    }

    try {
        await state.riotClient.sendRequest("custom/logExpressionScopeFunction", {
            uri: editor.document.uri.toString(),
            cursorPosition: editor.document.offsetAt(
                editor.selection.active
            )
        });
    } catch (error) {
        window.showErrorMessage(`Error during log: ${error}`);
    }
}