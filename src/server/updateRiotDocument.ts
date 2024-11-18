import { TextDocument } from "vscode-languageserver-textdocument";

import parseContent from "./utils/riot-parser/parseContent";

import compiledComponents from "./compiledComponents";
import getDocumentFilePath from "./getDocumentFilePath";
import parsedRiotDocuments from "./parsedRiotDocuments";

import { getState } from "./state";
import componentDeclarations from "./componentDeclarations";

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

        if (
            parsedContent.output.javascript != null &&
            parsedContent.output.javascript.text != null
        ) {
            tsLanguageService.updateDocument(
                filePath,
                parsedContent.output.javascript.text.text
            );
        } else {
            tsLanguageService.removeDocument(filePath)
        }
        parsedRiotDocuments.set(filePath, parsedContent);
    } catch (error) {
        // here will be some diagnostics
        tsLanguageService.removeDocument(filePath);
        parsedRiotDocuments.delete(filePath);
    }

    componentDeclarations.delete(filePath);
    compiledComponents.delete(filePath);
    return filePath;
}