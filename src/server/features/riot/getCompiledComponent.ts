import touchRiotDocument from "../../core/riot-documents/touch";

import { getState } from "../../core/state";

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