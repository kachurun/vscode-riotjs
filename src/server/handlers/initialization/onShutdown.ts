import { getState } from "../../core/state";

import riotDocuments from "../../riot-documents";

import removeRiotDocument from "../../riot-documents/remove";

export default function onShutdown() {
    for (let key in riotDocuments.keys()) {
        removeRiotDocument(key);
    }

    getState().tsLanguageService.dispose();
}