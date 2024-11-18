import { readFileSync } from "fs";
import { TextDocument } from "vscode-languageserver-textdocument";
import { URI } from "vscode-uri";

import { getState } from "./state";

export default function onRequestDocument(filePath: string) {
    const {
        connection,
        documents
    } = getState()

    const uri = URI.file(filePath).toString();

    // theoretically the following should always be false
    if (documents.get(uri)) {
        return true;
    }

    try {
        const content = readFileSync(filePath, { encoding: "utf-8" });

        const document = TextDocument.create(
            uri, "riotjs", 0, content
        );
    
        return true;
    } catch (error) {
        connection.console.error(error.toString());
    }
}