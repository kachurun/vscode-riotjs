import { existsSync, readFileSync } from "fs";
import { URI } from "vscode-uri";

import getComponentDeclaration from "./getComponentDeclaration";

import { getState } from "./state";

export default function onRequestDocument(filePath: string) {
    const {
        documents,
        tsLanguageService
    } = getState()

    const baseFilePath = filePath.replace(/.d.ts$/, "");

    const baseFileURI = URI.file(baseFilePath).toString();

    const baseDocument = documents.get(baseFileURI);
    const baseFileExists = existsSync(baseFilePath);
    if (baseDocument == null && !baseFileExists) {
        return false;
    }

    const declaration = getComponentDeclaration(
        baseFilePath,
        () => {
            if (baseDocument != null) {
                return baseDocument.getText()
            } else {
                return readFileSync(baseFilePath, { encoding: "utf-8" });
            }
        },
        "EXTERNAL"
    );
    if (declaration == null) {
        return false;
    }

    tsLanguageService.updateDocument(filePath, declaration);
    return true;
}