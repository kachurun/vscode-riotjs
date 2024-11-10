import {
    CompletionItem
} from "vscode-languageserver/node";

export default function onCompletionResolve(
    item: CompletionItem
): CompletionItem {
    return item;
}