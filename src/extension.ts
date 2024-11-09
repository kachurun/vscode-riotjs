import * as vscode from "vscode";
import * as path from "path";

import { LanguageClient, TransportKind } from "vscode-languageclient/node";

let riotClient: LanguageClient | null = null;
let cssClient: LanguageClient | null = null;
let outputChannel: vscode.OutputChannel | null = null;

function activateAutoClosing(context) {
    const config = vscode.workspace.getConfiguration("riotjs");
    const enableAutoClosing = config.get("enableAutoClosing");
    if (!enableAutoClosing) {
        return;
    }

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument((event) => {
            if (event.contentChanges.length === 0) return;

            const editor = vscode.window.activeTextEditor;
            if (!editor || editor.document !== event.document || editor.document.languageId !== "riotjs") {
                return;
            }

            const change = event.contentChanges[0];
            if (change.text !== ">") {
                return;
            }

            const position = change.range.end;
            const document = editor.document;
            const text = document.getText();
            const beforeCursor = text.slice(0, document.offsetAt(position));
            const openingTagMatch = beforeCursor.match(/<(\w+)(?:\s+[^>]*)?$/);
            if (!openingTagMatch || beforeCursor.endsWith("/>")) {
                return;
            }

            const tagName = openingTagMatch[1];
            editor.edit((editBuilder) => {
                editBuilder.insert(position, `></${tagName}`);
            }).then(() => {
                const newPosition = position.translate(0, 1);
                editor.selection = new vscode.Selection(newPosition, newPosition);
            });
        })
    );
}

function registerCommands(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('riotjs.logProgramFiles', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || editor.document.languageId !== 'riotjs') {
                return;
            }

            if (!riotClient) {
                vscode.window.showErrorMessage('Riot Language Server is not running');
                return;
            }

            try {
                await riotClient.sendRequest('custom/logProgramFiles');
            } catch (error) {
                vscode.window.showErrorMessage(`Error during log: ${error}`);
            }
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('riotjs.logTypeAtCursor', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || editor.document.languageId !== 'riotjs') {
                return;
            }

            if (!riotClient) {
                vscode.window.showErrorMessage('Riot Language Server is not running');
                return;
            }

            try {

                await riotClient.sendRequest('custom/logTypeAtCursor', {
                    uri: editor.document.uri.toString(),
                    cursorPosition: editor.document.offsetAt(
                        editor.selection.active
                    )
                });
            } catch (error) {
                vscode.window.showErrorMessage(`Error during log: ${error}`);
            }
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('riotjs.logScriptContent', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || editor.document.languageId !== 'riotjs') {
                return;
            }

            if (!riotClient) {
                vscode.window.showErrorMessage('Riot Language Server is not running');
                return;
            }

            try {

                await riotClient.sendRequest('custom/logScriptContent', {
                    uri: editor.document.uri.toString()
                });
            } catch (error) {
                vscode.window.showErrorMessage(`Error during log: ${error}`);
            }
        })
    );
}

export async function activate(context) {
    try {
        outputChannel = vscode.window.createOutputChannel("Riot Extension");
        context.subscriptions.push(outputChannel);
        outputChannel.appendLine("Starting activation...");

        const serverModule = context.asAbsolutePath(path.join('build', 'server.js'));
        outputChannel.appendLine(`Server module path: ${serverModule}`);

        const debugOptions = { execArgv: ["--nolazy", "--inspect=6009"] };

        const serverOptions = {
            run: { module: serverModule, transport: TransportKind.ipc },
            debug: {
                module: serverModule,
                transport: TransportKind.ipc,
                options: debugOptions,
            },
        };

        const clientOptions = {
            documentSelector: [{ scheme: "file", language: "riotjs" }]
        };

        if (!riotClient) {
            outputChannel.appendLine("Creating new client...");
            riotClient = new LanguageClient(
                "riotLanguageServer",
                "Riot Language Server",
                serverOptions,
                clientOptions
            );

            outputChannel.appendLine("Starting client...");
            await riotClient.start();
            outputChannel.appendLine("Client started successfully");

            activateAutoClosing(context);
            registerCommands(context);
        } else {
            outputChannel.appendLine("Riot Extension client already exists");
        }
    } catch (error) {
        if (outputChannel) {
            outputChannel.appendLine(`Activation error: ${error.message}`);
            outputChannel.appendLine(`Stack trace: ${error.stack}`);
        }
        throw error;
    }
}

export async function deactivate() {
    const promises: Array<Promise<void>> = [];

    if (riotClient) {
        promises.push(riotClient.stop().then(() => {
            riotClient = null;
        }));
    }
    if (cssClient) {
        promises.push(cssClient.stop().then(() => {
            cssClient = null;
        }));
    }

    await Promise.all(promises);
}
