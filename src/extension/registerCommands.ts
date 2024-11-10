import {
    commands,
    ExtensionContext,
    window
} from "vscode";

import logProgramFiles from "./commands/logProgramFiles";
import logTypeAtCursor from "./commands/logTypeAtCursor";
import logScriptContent from "./commands/logScriptContent";

export default function registerCommands(context: ExtensionContext) {
    context.subscriptions.push(
        commands.registerCommand(
            "riotjs.logProgramFiles",
            logProgramFiles
        )
    );
    context.subscriptions.push(
        commands.registerCommand(
            "riotjs.logTypeAtCursor",
            logTypeAtCursor
        )
    );
    context.subscriptions.push(
        commands.registerCommand(
            "riotjs.logScriptContent",
            logScriptContent
        )
    );
}