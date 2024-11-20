import { existsSync, readFileSync } from "fs";
import { URI } from "vscode-uri";

import TypeScriptLanguageService from "../TypeScriptLanguageService";

import getComponentDeclaration from "./getComponentDeclaration";
import getDocument from "./getDocument";

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
        console.log("requested content");
        const baseFilePath = filePath.replace(/.d.ts$/, "");
        
        const baseFileURI = URI.file(baseFilePath).toString();
        
        const baseDocument = getDocument(baseFileURI);
        const baseFileExists = existsSync(baseFilePath);
        if (baseDocument == null && !baseFileExists) {
            console.log("base file not found");
            return undefined;
        }
        
        console.log("getting declaration");
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
        console.log("found declaration");
        return declaration ?? undefined;
    },
    getDocumentVersion(filePath) {
        console.log("requested version");
        const baseFilePath = filePath.replace(/.d.ts$/, "");
        const version = this.getScriptVersion(baseFilePath);
        console.log("version", version);
        return version;
    },
};

export default RiotDeclarationDocumentsHandler;