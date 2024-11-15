import { window } from "vscode";

import state from "../state";

export default async function logProgramFiles() {
    const editor = window.activeTextEditor;
    if (!editor || editor.document.languageId !== "riotjs") {
        return;
    }

    if (!state.riotClient) {
        window.showErrorMessage("Riot Language Server is not running");
        return;
    }

    try {
        await state.riotClient.sendRequest("custom/logProgramFiles");
    } catch (error) {
        window.showErrorMessage(`Error during log: ${error}`);
    }
};