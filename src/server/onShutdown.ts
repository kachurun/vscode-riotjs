import riotDocuments from "./riotDocuments";

import { getState } from "./state";

import removeRiotDocument from "./riotDocuments/remove";

export default function onShutdown() {
    for (let key in riotDocuments.keys()) {
        removeRiotDocument(key);
    }

    getState().tsLanguageService.dispose();
}