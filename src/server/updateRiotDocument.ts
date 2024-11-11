import { TextDocument } from "vscode-languageserver-textdocument";

import parseContent from "../utils/riot-parser/parseContent";

import getDocumentFilePath from "./getDocumentFilePath";

import { getState } from "./state";
import parsedRiotDocuments from "./parsedRiotDocuments";

export default function updateRiotDocument(
    document: TextDocument
) {
    const {
        tsLanguageService
    } = getState();

    const filePath = getDocumentFilePath(document);

    try {
        const parsedContent = parseContent(
            document.getText()
        );

        if (parsedContent.output.javascript != null) {
            tsLanguageService.updateDocument(
                filePath,
                parsedContent.output.javascript.text.text
            );
        } else {
            tsLanguageService.removeDocument(filePath)
        }
        parsedRiotDocuments.set(filePath, parsedContent)
    } catch (error) {
        // here will be some diagnostics
        tsLanguageService.removeDocument(filePath);
        parsedRiotDocuments.delete(filePath);
    }

    return filePath;
}