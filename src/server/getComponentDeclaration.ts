import { TextDocument } from "vscode-languageserver-textdocument";

import TypeScriptLanguageService from "../TypeScriptLanguageService";

import componentDeclarations from "./componentDeclarations";
import getInternalDeclarationOfSourceFile from "./getInternalDeclarationOfSourceFile";
import parsedRiotDocuments from "./parsedRiotDocuments";
import touchRiotDocument from "./touchRiotDocument";

import { getState } from "./state";
import convertInternalDeclarationToExternal from "./convertInternalDeclarationToExternal";

const basicRiotComponentDeclaration = [
    `declare const _default: import("riot").RiotComponentWrapper<(`,
    `    import("riot").RiotComponent<Record<string, any>, {`,
    `        [x: string]: any;`,
    `        [x: symbol]: any;`,
    `    }>`,
    `)>;`,
    `export default _default;`
].join("\n");

function getInternalDeclaration(
    filePath: string,
    tsLanguageService: TypeScriptLanguageService
) {
    const parsedRiotDocument = parsedRiotDocuments.get(filePath);
    if (parsedRiotDocument == null) {
        return null;
    }

    if (parsedRiotDocument.output.javascript == null) {
        return basicRiotComponentDeclaration;
    }
    
    const sourceFile = tsLanguageService.getSourceFile(filePath);
    if (sourceFile == null) {
        return basicRiotComponentDeclaration
    }
    
    return getInternalDeclarationOfSourceFile(
        sourceFile, tsLanguageService.getProgram()
    ) || basicRiotComponentDeclaration;
}

export default function getComponentDeclaration(
    document: TextDocument,
    type: "INTERNAL" | "EXTERNAL"
): string | null {
    const {
        tsLanguageService
    } = getState();

    const filePath = touchRiotDocument(document);
    let internalDeclaration: string | null = null;
    if (componentDeclarations.has(filePath)) {
        const {
            internal,
            external
        } = componentDeclarations.get(filePath)!;
        if (type === "INTERNAL") {
            return internal;
        }
        if (type === "EXTERNAL" && external != null) {
            return external;
        }
        internalDeclaration = internal;
    }

    if (internalDeclaration == null) {
        internalDeclaration = getInternalDeclaration(
            filePath, tsLanguageService
        );
    }

    if (internalDeclaration == null) {
        return null;
    }

    const componentDeclaration = componentDeclarations.get(filePath) || {
        internal: internalDeclaration,
        external: null
    };
    componentDeclaration.internal = internalDeclaration;

    if (type == "INTERNAL") {
        componentDeclarations.set(filePath, componentDeclaration);
        return internalDeclaration;
    }

    const externalDeclaration = convertInternalDeclarationToExternal(
        internalDeclaration
    );

    componentDeclaration.external = externalDeclaration;
    componentDeclarations.set(filePath, componentDeclaration);

    return externalDeclaration;
}