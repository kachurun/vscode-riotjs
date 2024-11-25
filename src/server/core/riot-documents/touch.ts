import { getState } from "../state";

import updateRiotDocument from "./update";

export default function touchRiotDocument(
    filePath: string,
    getText: () => string
) {
    const riotDocument = getState().riotDocuments.get(filePath);
    if (riotDocument != null) {
        return riotDocument;
    }

    return updateRiotDocument(filePath, getText());
}