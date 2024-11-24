import riotDocuments from "./riotDocuments";

import { getState } from "./state";

export default function removeDocument(
    filePath: string
) {
    const {
        tsLanguageService
    } = getState();

    tsLanguageService.removeDocument(filePath);
    riotDocuments.delete(filePath);

    return filePath;
}