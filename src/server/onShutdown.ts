import riotDocuments from "./riot-documents";

import { getState } from "./state";

import removeRiotDocument from "./riot-documents/remove";

export default function onShutdown() {
    for (let key in riotDocuments.keys()) {
        removeRiotDocument(key);
    }

    getState().tsLanguageService.dispose();
}