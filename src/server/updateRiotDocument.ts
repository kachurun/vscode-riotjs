import { TextDocument } from "vscode-languageserver-textdocument";
import TypeScriptLanguageService from "../TypeScriptLanguageService";
import extractScriptContent from "./extractScriptContent";

export default function updateRiotDocument(
    document: TextDocument,
    tsLanguageService: TypeScriptLanguageService
) {
    const url = new URL(document.uri);
    const filePath = decodeURIComponent(url.pathname.startsWith("/") ?
        url.pathname.slice(1) : url.pathname
    );

    const { content, offset } = extractScriptContent(document);
    if (content == null) {
        return { filePath, scriptOffset: -1 };
    }

    tsLanguageService.updateDocument(filePath, content);
    return { filePath, scriptOffset: offset };
}