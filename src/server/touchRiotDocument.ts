import { TextDocument } from "vscode-languageserver-textdocument";

import getDocumentFilePath from "./getDocumentFilePath";
import updateRiotDocument from "./updateRiotDocument";

import { getState } from "./state";

export default function touchRiotDocument(
    document: TextDocument
) {
    const {
        tsLanguageService
    } = getState();

    const filePath = getDocumentFilePath(document);
    if (tsLanguageService.hasDocument(filePath)) {
        return filePath;
    }

    return updateRiotDocument(document);
}