import { getState } from "../core/state";

import removeRiotDocument from "../riot-documents/remove";

import riotDocuments from "../riot-documents";

export default function onShutdown() {
    for (let key in riotDocuments.keys()) {
        removeRiotDocument(key);
    }

    getState().tsLanguageService.dispose();
}