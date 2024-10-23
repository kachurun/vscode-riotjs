const vscode = require('vscode');
const { LanguageClient, TransportKind } = require('vscode-languageclient/node');
const path = require('path');
const ts = require('typescript');

let riotClient;
let cssClient;
let outputChannel;

function extractScriptContent(document, position) {
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
    outputChannel.appendLine('Received jsCompletion request: ' + JSON.stringify(params, null, 2));

    const document = await vscode.workspace.openTextDocument(vscode.Uri.parse(params.textDocument.uri));
    const position = new vscode.Position(params.position.line, params.position.character);

    const { content, offset } = extractScriptContent(document, position);
    
    if (!content) {
      outputChannel.appendLine('No script content found');
      return { items: [], scriptOffset: { line: 0, character: 0 } };
    }

    const scriptStartPosition = document.positionAt(offset);
    const adjustedPosition = new vscode.Position(
      position.line - scriptStartPosition.line,
      position.line === scriptStartPosition.line 
        ? position.character - scriptStartPosition.character 
        : position.character
    );

    outputChannel.appendLine('Script start position: ' + JSON.stringify(scriptStartPosition));
    outputChannel.appendLine('Adjusted position: ' + JSON.stringify(adjustedPosition));

    try {
      const completionItems = getTypeScriptCompletions(content, adjustedPosition);

      outputChannel.appendLine(`Received ${completionItems.length} completion items from TS language service`);

      // Log more details about the completion items
      outputChannel.appendLine('Completion items details:');
      completionItems.slice(0, 5).forEach((item, index) => {
        outputChannel.appendLine(`Item ${index}:`);
        outputChannel.appendLine(`  Label: ${item.label}`);
        outputChannel.appendLine(`  Kind: ${item.kind}`);
        outputChannel.appendLine(`  Detail: ${item.detail}`);
        outputChannel.appendLine(`  InsertText: ${item.insertText}`);
        if (item.textEdit) {
          outputChannel.appendLine(`  TextEdit: ${JSON.stringify(item.textEdit)}`);
        }
        outputChannel.appendLine('');
      });

      // Send the completion list along with the script offset information
      const result = {
        items: completionItems,
        scriptOffset: {
          line: scriptStartPosition.line,
          character: scriptStartPosition.character
        }
      };

      outputChannel.appendLine(`Returning ${result.items.length} items to language server`);
      outputChannel.appendLine(`First item: ${JSON.stringify(result.items[0], null, 2)}`);
      return result;
    } catch (error) {
      outputChannel.appendLine('Error in jsCompletion: ' + error.toString());
      return { items: [], scriptOffset: { line: 0, character: 0 } };
    }
  });
}

function getTypeScriptCompletions(content, position) {
  const fileName = 'virtual.ts';
  const compilerOptions = {
    target: ts.ScriptTarget.Latest,
    module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    strict: true,
  };

  const host = {
    getScriptFileNames: () => [fileName],
    getScriptVersion: () => '0',
    getScriptSnapshot: (name) => {
      if (name === fileName) {
        return ts.ScriptSnapshot.fromString(content);
      }
      return undefined;
    },
    getCurrentDirectory: () => process.cwd(),
    getCompilationSettings: () => compilerOptions,
    getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
    fileExists: () => true,
    readFile: () => '',
    readDirectory: () => [],
    directoryExists: () => true,
    getDirectories: () => [],
  };

  const languageService = ts.createLanguageService(host);

  const offset = ts.getPositionOfLineAndCharacter(
    ts.createSourceFile(fileName, content, ts.ScriptTarget.Latest),
    position.line,
    position.character
  );

  const completions = languageService.getCompletionsAtPosition(fileName, offset, undefined);

  return completions.entries;
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

  outputChannel.appendLine('Activating Riot Extension');

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
    middleware: {
      provideCompletionItem: async (document, position, context, token, next) => {
        outputChannel.appendLine('Middleware: provideCompletionItem called');
        const result = await next(document, position, context, token);
        outputChannel.appendLine(`Middleware: Received ${result?.items?.length || 0} completion items`);
        return result;
      }
    }
  };

  if (!riotClient) {
    riotClient = new LanguageClient(
      'riotLanguageServer',
      'Riot Language Server',
      serverOptions,
      clientOptions
    );

    await riotClient.start();
    outputChannel.appendLine('Riot Extension client started');

    activateJSClient(context, riotClient);
    activateCSSClient(context);
    activateAutoClosing(context);

    let disposable = vscode.commands.registerCommand('riotjs.triggerCompletion', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }
      const document = editor.document;
      const position = editor.selection.active;

      const completionList = await vscode.commands.executeCommand(
        'vscode.executeCompletionItemProvider',
        document.uri,
        position
      );

      outputChannel.appendLine(`Manual trigger received ${completionList?.items?.length || 0} completion items, ${ typeof completionList }`);
      outputChannel.appendLine(`First item: ${JSON.stringify(completionList?.items?.[0] || null, null, 2)}`);
    });

    context.subscriptions.push(disposable);
  } else {
    outputChannel.appendLine('Riot Extension client already exists');
  }
}

function deactivate() {
  const promises = [];
  if (riotClient) promises.push(riotClient.stop());
  if (cssClient) promises.push(cssClient.stop());
  return Promise.all(promises);
}

module.exports = {
  activate,
  deactivate,
};
