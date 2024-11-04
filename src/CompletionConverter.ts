import * as ts from 'typescript';
import { CompletionItemKind, CompletionList, CompletionItem } from 'vscode-languageserver-types';

export default class CompletionConverter {
    private static kindMap: Record<string, CompletionItemKind> = {
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

    public static convert(completionInfo: ts.WithMetadata<ts.CompletionInfo> | undefined): CompletionList {
        if (!completionInfo) {
            return {
                isIncomplete: false,
                items: []
            };
        }

        const items = completionInfo.entries.map(entry => {
            const item: CompletionItem = {
                label: `${entry.name}${
                    (entry.kindModifiers?.includes('optional') ? "?" : "")
                }`,
                kind: this.kindMap[entry.kind] || CompletionItemKind.Text,
                detail: entry.labelDetails?.detail,
                documentation: undefined,
                sortText: entry.sortText,
                filterText: entry.filterText,
                insertText: entry.insertText || entry.name,
                // textEdit: entry.replacementSpan ? {
                //     newText: entry.insertText || entry.name,
                //     range: {
                //         start: { line: 0, character: 0 },
                //         end: { line: 0, character: 0 }
                //     }
                // } : undefined,
                data: entry.data
            };

            return item;
        });

        return {
            isIncomplete: completionInfo.isIncomplete || false,
            items
        };
    }
}
