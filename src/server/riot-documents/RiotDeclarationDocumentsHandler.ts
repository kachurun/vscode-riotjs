import { existsSync, readFileSync } from "fs";
import { URI } from "vscode-uri";

import TypeScriptLanguageService from "../../TypeScriptLanguageService";

import getDocument from "../core/getDocument";

import getComponentDeclaration from "../features/riot/getComponentDeclaration";

const RiotDeclarationDocumentsHandler: (
    TypeScriptLanguageService.DocumentsHandler
) = {
    extension: ".riot.d.ts",
    doesFileExists(filePath) {
        const baseFilePath = filePath.replace(/.d.ts$/, "");
        
        const baseFileURI = URI.file(baseFilePath).toString();
        
        return (
            getDocument(baseFileURI) != null ||
            existsSync(baseFilePath)
        );
    },
    getDocumentContent(filePath) {
        const baseFilePath = filePath.replace(/.d.ts$/, "");
        
        const baseFileURI = URI.file(baseFilePath).toString();
        
        const baseDocument = getDocument(baseFileURI);
        const baseFileExists = existsSync(baseFilePath);
        if (baseDocument == null && !baseFileExists) {
            return undefined;
        }

        const declaration = getComponentDeclaration(
            baseFilePath,
            () => {
                if (baseDocument != null) {
                    return baseDocument.getText()
                } else {
                    return readFileSync(
                        baseFilePath,
                        { encoding: "utf-8" }
                    );
                }
            },
            "EXTERNAL"
        );
        return declaration ?? undefined;
    },
    getDocumentVersion(filePath) {
        const baseFilePath = filePath.replace(/.d.ts$/, "");
        const version = this.getScriptVersion(baseFilePath);
        return version;
    },
};

export default RiotDeclarationDocumentsHandler;