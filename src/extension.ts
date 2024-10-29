import * as vscode from "vscode";
import * as path from "path";

import { LanguageClient, TransportKind } from "vscode-languageclient/node";

let riotClient: LanguageClient | null = null;
let cssClient: LanguageClient | null = null;
let outputChannel: vscode.OutputChannel | null = null;

function activateCSSClient(context) {
    const serverModule = context.asAbsolutePath(path.join(
        "node_modules",
        "vscode-css-languageserver-bin",
        "cssServerMain.js"
    ));

    const serverOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: TransportKind.ipc,
            options: { execArgv: ["--nolazy", "--inspect=6011"] }
        }
    };

    const clientOptions = {
        documentSelector: [{ scheme: "file", language: "css" }],
    };

    cssClient = new LanguageClient(
        "cssLanguageServer",
        "CSS Language Server",
        serverOptions,
        clientOptions
    );

    context.subscriptions.push(cssClient.start());
}

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
            if (!editor || editor.document === event.document || editor.document.languageId !== "riot") {
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
            if (!editor || editor.document.languageId !== 'riot') {
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
}

export async function activate(context) {
    outputChannel = vscode.window.createOutputChannel("Riot Extension");
    context.subscriptions.push(outputChannel);

    const serverModule = context.asAbsolutePath(path.join(
        path.relative(context.extensionPath, __dirname),
        "server.js"
    ));
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
        documentSelector: [{ scheme: "file", language: "riot" }]
    };

    if (!riotClient) {
        riotClient = new LanguageClient(
            "riotLanguageServer",
            "Riot Language Server",
            serverOptions,
            clientOptions
        );

        await riotClient.start();

        activateCSSClient(context);
        activateAutoClosing(context);
        registerCommands(context);
    } else {
        outputChannel.appendLine("Riot Extension client already exists");
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
