import removeDocument from "./removeDocument";
import riotDocuments from "./riotDocuments";

import { getState } from "./state";

export default function onShutdown() {
    for (let key in riotDocuments.keys()) {
        removeDocument(key);
    }

    getState().tsLanguageService.dispose();
}