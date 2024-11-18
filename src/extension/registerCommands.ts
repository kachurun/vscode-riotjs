import {
    commands,
    ExtensionContext
} from "vscode";

import logCompiledComponent from "./commands/logCompiledComponent";
import logContentTypeAtCursor from "./commands/logContentTypeAtCursor";
import logDeclaration from "./commands/logDeclaration";
import logProgramFiles from "./commands/logProgramFiles";
import logScriptContent from "./commands/logScriptContent";
import logTypeAtCursor from "./commands/logTypeAtCursor";

export default function registerCommands(context: ExtensionContext) {
    context.subscriptions.push(
        commands.registerCommand(
            "riotjs.logCompiledComponent",
            logCompiledComponent
        )
    );
    context.subscriptions.push(
        commands.registerCommand(
            "riotjs.logContentTypeAtCursor",
            logContentTypeAtCursor
        )
    );
    context.subscriptions.push(
        commands.registerCommand(
            "riotjs.logExternalDeclaration",
            () => logDeclaration("EXTERNAL")
        )
    );
    context.subscriptions.push(
        commands.registerCommand(
            "riotjs.logInternalDeclaration",
            () => logDeclaration("INTERNAL")
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