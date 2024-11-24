import riotDocuments from ".";

import { getState } from "../state";

export default function removeRiotDocument(
    filePath: string
) {
    const {
        tsLanguageService
    } = getState();

    tsLanguageService.removeDocument(filePath);
    riotDocuments.delete(filePath);

    return filePath;
}