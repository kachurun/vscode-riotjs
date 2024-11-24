import removeRiotDocument from "../../core/riot-documents/remove";

import { getState } from "../../core/state";

export default function onShutdown() {
    const {
        riotDocuments,
        tsLanguageService
    } = getState();

    for (let key in riotDocuments.keys()) {
        removeRiotDocument(key);
    }

    tsLanguageService.dispose();
}