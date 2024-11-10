import { TextDocument } from "vscode-languageserver-textdocument";

export default function extractScriptContent(
    document: TextDocument
) {
    const text = document.getText();
    const scriptMatch = text.match(/<script[^>]*>([\s\S]*?)<\/script>/);
    if (scriptMatch) {
        const scriptContent = scriptMatch[1].trim();
        const scriptOffset = text.indexOf(scriptContent);
        return { content: scriptContent, offset: scriptOffset };
    }
    return { content: null, offset: 0 };
}