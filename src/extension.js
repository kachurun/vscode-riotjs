const vscode = require('vscode');
const { LanguageClient, TransportKind } = require('vscode-languageclient/node');
const path = require('path');
const ts = require('typescript');
const url = require('url');
const fs = require('fs');

const TypeScriptLanguageService = require("./TypeScriptLanguageService").default;

let riotClient;
let cssClient;
let outputChannel;
let tsLanguageService;

function extractScriptContent(document) {
  const text = document.getText();
  const scriptMatch = text.match(/<script[^>]*>([\s\S]*?)<\/script>/);
  if (scriptMatch) {
    const scriptContent = scriptMatch[1].trim();
    const scriptOffset = text.indexOf(scriptContent);
    return { content: scriptContent, offset: scriptOffset };
  }
  return { content: '', offset: 0 };
}

function activateCSSClient(context) {
  const serverModule = context.asAbsolutePath(
    path.join('node_modules', 'vscode-css-languageserver-bin', 'cssServerMain.js')
  );

  const serverOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: { execArgv: ['--nolazy', '--inspect=6011'] }
    }
  };

  const clientOptions = {
    documentSelector: [{ scheme: 'file', language: 'css' }],
  };

  cssClient = new LanguageClient(
    'cssLanguageServer',
    'CSS Language Server',
    serverOptions,
    clientOptions
  );

  context.subscriptions.push(cssClient.start());
}

function activateJSClient(context, riotClient) {
  riotClient.onRequest('custom/jsCompletion', async (params) => {
    const document = await vscode.workspace.openTextDocument(vscode.Uri.parse(params.textDocument.uri));
    
    const { content, offset } = extractScriptContent(document);
    
    if (!content) {
      outputChannel.appendLine('No script content found');
      return { items: [], scriptOffset: { line: 0, character: 0 } };
    }
    
    const position = new vscode.Position(params.position.line, params.position.character);
    const adjustedRequestedOffset = document.offsetAt(position) - offset;

    const url = new URL(params.textDocument.uri);
    const filePath = decodeURIComponent(url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname);

    try {
      tsLanguageService.updateDocument(filePath, content);

      const completionItems = tsLanguageService.getCompletionsAtPosition(filePath, adjustedRequestedOffset);

      // Send the completion list along with the script offset information
      const result = {
        items: completionItems,
        scriptOffset: offset
      };

      return result;
    } catch (error) {
      outputChannel.appendLine('Error in jsCompletion: ' + error.toString());
      outputChannel.appendLine('Error stack: ' + error.stack);
      return { items: [], scriptOffset: { line: 0, character: 0 } };
    }
  });
}

function activateAutoClosing(context) {
  const config = vscode.workspace.getConfiguration('riotjs');
  const enableAutoClosing = config.get('enableAutoClosing');
  if (!enableAutoClosing) {
    return;
  }

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.contentChanges.length === 0) return;
      
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document === event.document) {
        const change = event.contentChanges[0];
        if (change.text === '>') {
          const position = change.range.end;
          const document = editor.document;
          const text = document.getText();
          const beforeCursor = text.slice(0, document.offsetAt(position));
          const openingTagMatch = beforeCursor.match(/<(\w+)(?:\s+[^>]*)?$/);

          if (openingTagMatch && !beforeCursor.endsWith('/>')) {
            const tagName = openingTagMatch[1];
            editor.edit((editBuilder) => {
              editBuilder.insert(position, `></${tagName}`);
            }).then(() => {
              const newPosition = position.translate(0, 1);
              editor.selection = new vscode.Selection(newPosition, newPosition);
            });
          }
        }
      }
    })
  );
}

async function activate(context) {
  // Create output channel only if it doesn't exist
  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel("Riot Extension");
    context.subscriptions.push(outputChannel);
  }

  const serverModule = context.asAbsolutePath(path.join('src', 'server.js'));
  const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

  const serverOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions,
    },
  };

  const clientOptions = {
    documentSelector: [{ scheme: 'file', language: 'riot' }],
    // middleware: {
    //   provideCompletionItem: async (document, position, context, token, next) => {
    //     outputChannel.appendLine('Middleware: provideCompletionItem called');
    //     const result = await next(document, position, context, token);
    //     outputChannel.appendLine(`Middleware: Received ${result?.items?.length || 0} completion items`);
    //     return result;
    //   }
    // }
  };

  if (!riotClient) {
    riotClient = new LanguageClient(
      'riotLanguageServer',
      'Riot Language Server',
      serverOptions,
      clientOptions
    );

    await riotClient.start();

    activateJSClient(context, riotClient);
    activateCSSClient(context);
    activateAutoClosing(context);
  } else {
    outputChannel.appendLine('Riot Extension client already exists');
  }

  // Initialize the TypeScript language service
  tsLanguageService = new TypeScriptLanguageService();
}

function deactivate() {
  const promises = [];
  if (riotClient) promises.push(riotClient.stop());
  if (cssClient) promises.push(cssClient.stop());
  
  // Dispose of the TypeScript language service
  if (tsLanguageService) {
    tsLanguageService.dispose();
    tsLanguageService = null;
  }

  // Clear virtual files
  virtualFiles.clear();

  return Promise.all(promises);
}

module.exports = {
  activate,
  deactivate,
};
