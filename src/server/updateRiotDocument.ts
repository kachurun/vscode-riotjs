import { TextDocument } from "vscode-languageserver-textdocument";

import extractScriptContent from "./extractScriptContent";
import getDocumentFilePath from "./getDocumentFilePath";
import scriptOffsetsMap from "./scriptOffsetsMap";

import { getState } from "./state";

export default function updateRiotDocument(
    document: TextDocument
) {
    const {
        tsLanguageService
    } = getState();

    const filePath = getDocumentFilePath(document);

    const { content, offset } = extractScriptContent(document);
    if (content == null) {
        scriptOffsetsMap.set(filePath, -1);
        return filePath;
    }
    
    tsLanguageService.updateDocument(filePath, content);
    scriptOffsetsMap.set(filePath, offset);
    return filePath;
}