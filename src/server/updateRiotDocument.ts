import RiotDocument from "./RiotDocument";
import riotDocuments from "./riotDocuments";

import { getState } from "./state";

export default function updateRiotDocument(
    filePath: string,
    content: string
) {
    const {
        tsLanguageService
    } = getState();

    try {
        if (riotDocuments.has(filePath)) {
            const riotDocument = riotDocuments.get(filePath)!;
            return riotDocument.update(
                content, tsLanguageService, riotDocuments
            );
        }
        const riotDocument = new RiotDocument(
            filePath, content,
            tsLanguageService, riotDocuments
        )
        riotDocuments.set(filePath, riotDocument);
        return riotDocument;
    } catch (error) {
        // here there will be some diagnostics
        riotDocuments.delete(filePath);
        return null;
    }
}