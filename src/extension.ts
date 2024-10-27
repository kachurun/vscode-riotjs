import * as vscode from "vscode";
import * as path from "path";

import { LanguageClient, TransportKind } from "vscode-languageclient/node";

import TypeScriptLanguageService from "./TypeScriptLanguageService";

let riotClient: LanguageClient | null = null;
let cssClient: LanguageClient | null = null;
let outputChannel: vscode.OutputChannel | null = null;
let tsLanguageService: TypeScriptLanguageService | null = null;

function extractScriptContent(document) {
    const text = document.getText();
    const scriptMatch = text.match(/<script[^>]*>([\s\S]*?)<\/script>/);
    if (scriptMatch) {
        const scriptContent = scriptMatch[1].trim();
        const scriptOffset = text.indexOf(scriptContent);
        return { content: scriptContent, offset: scriptOffset };
    }
    return { content: "", offset: 0 };
}

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

function activateJSClient(context, riotClient) {
    riotClient.onRequest("custom/jsCompletion", async (params) => {
        if (tsLanguageService == null) {
            outputChannel?.appendLine("No Language Service");
            return {
                completions: [],
                scriptOffset: { line: 0, character: 0 }
            };
        }
        const document = await vscode.workspace.openTextDocument(vscode.Uri.parse(params.textDocument.uri));

        const { content, offset } = extractScriptContent(document);

        if (!content) {
            outputChannel?.appendLine("No script content found");
            return {
                completions: [],
                scriptOffset: { line: 0, character: 0 }
            };
        }
        
        const position = new vscode.Position(params.position.line, params.position.character);
        const adjustedRequestedOffset = document.offsetAt(position) - offset;

        const url = new URL(params.textDocument.uri);
        const filePath = decodeURIComponent(url.pathname.startsWith("/") ?
            url.pathname.slice(1) : url.pathname
        );

        try {
            tsLanguageService.updateDocument(filePath, content);

            const completions = tsLanguageService.getCompletionsAtPosition(filePath, adjustedRequestedOffset);

            return {
                completions,
                scriptOffset: offset
            };
        } catch (error) {
            outputChannel?.appendLine(`Error in jsCompletion: ${error}`);
            outputChannel?.appendLine(`Error stack: ${error.stack}`);
            return {
                completions: [],
                scriptOffset: { line: 0, character: 0 }
            };
        }
    });
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

        activateJSClient(context, riotClient);
        activateCSSClient(context);
        activateAutoClosing(context);
    } else {
        outputChannel.appendLine("Riot Extension client already exists");
    }

    tsLanguageService = new TypeScriptLanguageService();
    context.subscriptions.push(tsLanguageService);
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
