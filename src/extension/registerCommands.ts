import {
    commands,
    ExtensionContext
} from "vscode";

import logContentTypeAtCursor from "./commands/logContentTypeAtCursor";
import logProgramFiles from "./commands/logProgramFiles";
import logScriptContent from "./commands/logScriptContent";
import logTypeAtCursor from "./commands/logTypeAtCursor";

export default function registerCommands(context: ExtensionContext) {
    context.subscriptions.push(
        commands.registerCommand(
            "riotjs.logContentTypeAtCursor",
            logContentTypeAtCursor
        )
    );
    context.subscriptions.push(
        commands.registerCommand(
            "riotjs.logProgramFiles",
            logProgramFiles
        )
    );
    context.subscriptions.push(
        commands.registerCommand(
            "riotjs.logScriptContent",
            logScriptContent
        )
    );
    context.subscriptions.push(
        commands.registerCommand(
            "riotjs.logTypeAtCursor",
            logTypeAtCursor
        )
    );
}