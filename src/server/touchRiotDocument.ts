import { TextDocument } from "vscode-languageserver-textdocument";

import getDocumentFilePath from "./getDocumentFilePath";
import parsedRiotDocuments from "./parsedRiotDocuments";
import updateRiotDocument from "./updateRiotDocument";

export default function touchRiotDocument(
    filePath: string,
    getText: () => string
) {
    if (parsedRiotDocuments.has(filePath)) {
        return filePath;
    }

    return updateRiotDocument(filePath, getText());
}