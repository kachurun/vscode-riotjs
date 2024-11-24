import riotDocuments from "./riotDocuments";
import updateRiotDocument from "./updateRiotDocument";

export default function touchRiotDocument(
    filePath: string,
    getText: () => string
) {
    const riotDocument = riotDocuments.get(filePath);
    if (riotDocument != null) {
        return riotDocument;
    }

    return updateRiotDocument(filePath, getText());
}