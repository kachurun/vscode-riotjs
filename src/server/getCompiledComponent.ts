import { getState } from "./state";

import touchRiotDocument from "./riotDocuments/touch";

export default function getCompiledComponent(
    filePath: string,
    getText: () => string
) {
    const riotDocument = touchRiotDocument(filePath, getText);
    if (riotDocument == null) {
        return null;
    }

    try {
        return riotDocument.getCompiled();
    } catch (error) {
        getState().connection.console.error(`Error: ${error}`);
    }
    return null;
}