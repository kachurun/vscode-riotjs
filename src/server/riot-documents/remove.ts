import { getState } from "../core/state";

import riotDocuments from "./riotDocuments";

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