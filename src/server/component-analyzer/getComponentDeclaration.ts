import { getState } from "../core/state";

import touchRiotDocument from "../riot-documents/touch";

export default function getComponentDeclaration(
    filePath: string,
    getText: () => string,
    type: "INTERNAL" | "EXTERNAL"
): string | null {
    const {
        tsLanguageService
    } = getState();

    const riotDocument = touchRiotDocument(filePath, getText);
    if (riotDocument == null) {
        return null;
    }

    const internalDeclaration = riotDocument.getInternalDeclaration(tsLanguageService);
    if (type === "INTERNAL") {
        return internalDeclaration;
    }
    
    const externalDeclaration = riotDocument.getExternalDeclaration(tsLanguageService);
    if (type === "EXTERNAL") {
        return externalDeclaration;
    }
    
    throw new Error(`Invalid declaration type: "${type}"`);
}