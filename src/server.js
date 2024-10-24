const {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  TextDocumentPositionParams,
  CompletionItem,
  CompletionItemKind,
  TextDocumentSyncKind,
} = require('vscode-languageserver/node');
const { TextDocument } = require('vscode-languageserver-textdocument');
const { getLanguageService } = require('vscode-html-languageservice');
const { URI } = require('vscode-uri');
const path = require('path');
const ts = require('typescript');

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents = new TextDocuments(TextDocument);

const htmlLanguageService = getLanguageService();

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

connection.onInitialize((params) => {
  const capabilities = params.capabilities;

  hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration);
  hasWorkspaceFolderCapability = !!(capabilities.workspace && !!capabilities.workspace.workspaceFolders);
  hasDiagnosticRelatedInformationCapability = !!(
    capabilities.textDocument &&
    capabilities.textDocument.publishDiagnostics &&
    capabilities.textDocument.publishDiagnostics.relatedInformation
  );

  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        resolveProvider: true,
        triggerCharacters: ['<', ' ', ':', '{', '.'],
      },
    },
  };
});

function isInsideScript(document, position) {
  const text = document.getText();
  const offset = document.offsetAt(position);
  const beforeCursor = text.slice(0, offset);
  
  const scriptOpenTag = /<script[^>]*>/gi;
  const scriptCloseTag = /<\/script>/gi;
  
  let scriptStart = -1;
  let match;
  
  while ((match = scriptOpenTag.exec(beforeCursor)) !== null) {
    scriptStart = match.index + match[0].length;
  }
  
  if (scriptStart === -1) return false;
  
  const afterScriptStart = text.slice(scriptStart);
  const scriptEnd = afterScriptStart.search(scriptCloseTag);
  
  return scriptEnd === -1 || offset < scriptStart + scriptEnd;
}

function isInsideStyle(document, position) {
  const text = document.getText();
  const offset = document.offsetAt(position);
  const beforeCursor = text.slice(0, offset);
  
  const styleMatch = beforeCursor.match(/<style[^>]*>(?:.|\n)*$/);
  
  return !!styleMatch;
}

function isInsideExpression(document, position) {
  const text = document.getText();
  const offset = document.offsetAt(position);
  const beforeCursor = text.slice(0, offset);
  
  const expressionMatch = beforeCursor.match(/\{[^}]*$/);
  
  return !!expressionMatch;
}

connection.onCompletion(async (textDocumentPosition) => {
  const document = documents.get(textDocumentPosition.textDocument.uri);
  if (!document) {
    return [];
  }

  try {
    const textBeforeCursor = document.getText({
      start: { line: 0, character: 0 },
      end: textDocumentPosition.position
    });

    if (isInsideExpression(document, textDocumentPosition.position)) {
      return {
        isIncomplete: false,
        items: []
      };
    } else if (
      isInsideScript(document, textDocumentPosition.position)
    ) {
      const result = await connection.sendRequest('custom/jsCompletion', textDocumentPosition);
      
      if (!result || !result.items || !Array.isArray(result.items)) {
        connection.console.error('Invalid jsCompletion result');
        return {
          isIncomplete: false,
          items: []
        };
      }

      const { items, scriptOffset } = result;

      const mappedItems = items.map(item => {
        const kind = mapCompletionItemKind(item.kind);
        // const textEdit = mapTextEdit(item.textEdit, scriptOffset);
        
        const completionItem = CompletionItem.create(item.name);
        completionItem.kind = kind;
        completionItem.sortText = item.sortText;
        completionItem.insertText = item.insertText;

        return completionItem;
      });

      return {
        isIncomplete: false,
        items: mappedItems
      };
    } else if (isInsideStyle(document, textDocumentPosition.position)) {
      const result = await connection.sendRequest('custom/cssCompletion', {
        textDocument: textDocumentPosition.textDocument,
        position: textDocumentPosition.position,
      });
      return {
        isIncomplete: false,
        items: result || []
      };
    } else {
      const htmlDocument = htmlLanguageService.parseHTMLDocument(document);
      const htmlCompletions = htmlLanguageService.doComplete(document, textDocumentPosition.position, htmlDocument);
      return {
        isIncomplete: false,
        items: htmlCompletions.items
      };
    }
  } catch (error) {
    connection.console.error('Error in completion handler: ' + error.toString());
    connection.console.error('Stack trace: ' + error.stack);
    return {
      isIncomplete: false,
      items: []
    };
  }
});

// Add this new handler
connection.onCompletionResolve((item) => {
  // You can add more detailed information to the item here if needed
  // For now, we'll just return the item as is
  return item;
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();

function mapCompletionItemKind(kind) {
  const kindMap = {
    [ts.ScriptElementKind.unknown]: CompletionItemKind.Text,
    [ts.ScriptElementKind.warning]: CompletionItemKind.Text,
    [ts.ScriptElementKind.keyword]: CompletionItemKind.Keyword,
    [ts.ScriptElementKind.scriptElement]: CompletionItemKind.File,
    [ts.ScriptElementKind.moduleElement]: CompletionItemKind.Module,
    [ts.ScriptElementKind.classElement]: CompletionItemKind.Class,
    [ts.ScriptElementKind.localClassElement]: CompletionItemKind.Class,
    [ts.ScriptElementKind.interfaceElement]: CompletionItemKind.Interface,
    [ts.ScriptElementKind.typeElement]: CompletionItemKind.Class,
    [ts.ScriptElementKind.enumElement]: CompletionItemKind.Enum,
    [ts.ScriptElementKind.enumMemberElement]: CompletionItemKind.EnumMember,
    [ts.ScriptElementKind.variableElement]: CompletionItemKind.Variable,
    [ts.ScriptElementKind.localVariableElement]: CompletionItemKind.Variable,
    [ts.ScriptElementKind.functionElement]: CompletionItemKind.Function,
    [ts.ScriptElementKind.localFunctionElement]: CompletionItemKind.Function,
    [ts.ScriptElementKind.memberFunctionElement]: CompletionItemKind.Method,
    [ts.ScriptElementKind.memberGetAccessorElement]: CompletionItemKind.Property,
    [ts.ScriptElementKind.memberSetAccessorElement]: CompletionItemKind.Property,
    [ts.ScriptElementKind.memberVariableElement]: CompletionItemKind.Field,
    [ts.ScriptElementKind.constructorImplementationElement]: CompletionItemKind.Constructor,
    [ts.ScriptElementKind.callSignatureElement]: CompletionItemKind.Function,
    [ts.ScriptElementKind.indexSignatureElement]: CompletionItemKind.Property,
    [ts.ScriptElementKind.constructSignatureElement]: CompletionItemKind.Constructor,
    [ts.ScriptElementKind.parameterElement]: CompletionItemKind.Variable,
    [ts.ScriptElementKind.typeParameterElement]: CompletionItemKind.TypeParameter,
    [ts.ScriptElementKind.primitiveType]: CompletionItemKind.Value,
    [ts.ScriptElementKind.label]: CompletionItemKind.Text,
    [ts.ScriptElementKind.alias]: CompletionItemKind.Text,
    [ts.ScriptElementKind.constElement]: CompletionItemKind.Constant,
    [ts.ScriptElementKind.letElement]: CompletionItemKind.Variable,
    [ts.ScriptElementKind.directory]: CompletionItemKind.Folder,
    [ts.ScriptElementKind.externalModuleName]: CompletionItemKind.Module,
    [ts.ScriptElementKind.jsxAttribute]: CompletionItemKind.Property,
    [ts.ScriptElementKind.string]: CompletionItemKind.Text,
  };

  return kindMap[kind] || CompletionItemKind.Text;
}

function mapTextEdit(textEdit, scriptOffset) {
  if (typeof textEdit !== 'object' || textEdit === null) {
    return textEdit;
  }

  const { range } = textEdit;
  if (Array.isArray(range) && range.length === 2) {
    connection.console.log(`Mapping textEdit: ${JSON.stringify(textEdit, null, 2)}`);
    const start = {
      "line": range[0].line + scriptOffset.line,
      "character": range[0].character + (range[0].line === 0 ?
        scriptOffset.character : 0
      )
    };
    const end = {
      "line": range[1].line + scriptOffset.line,
      "character": range[1].character + (range[1].line === 0 ?
        scriptOffset.character : 0
      )
    };
    textEdit.range = { start, end };
  } else {
    connection.console.log(`Not mapping textEdit: ${JSON.stringify(textEdit, null, 2)}`);
  }
  return textEdit;
}
