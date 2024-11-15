import { TextDocument } from "vscode-languageserver-textdocument";

import getDocumentFilePath from "./getDocumentFilePath";
import parsedRiotDocuments from "./parsedRiotDocuments";
import updateRiotDocument from "./updateRiotDocument";

export default function touchRiotDocument(
    document: TextDocument
) {
    const filePath = getDocumentFilePath(document);
    if (parsedRiotDocuments.has(filePath)) {
        return filePath;
    }

    return updateRiotDocument(document);
}