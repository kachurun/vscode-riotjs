import { TextDocument } from "vscode-languageserver-textdocument";

import compiledComponents from "./compiledComponents";
import componentDeclarations from "./componentDeclarations";
import getDocumentFilePath from "./getDocumentFilePath";
import parsedRiotDocuments from "./parsedRiotDocuments";

import { getState } from "./state";

export default function removeDocument(
    filePath: string
) {
    const {
        tsLanguageService
    } = getState();

    tsLanguageService.removeDocument(filePath);
    parsedRiotDocuments.delete(filePath);
    componentDeclarations.delete(filePath);
    compiledComponents.delete(filePath);

    return filePath;
}