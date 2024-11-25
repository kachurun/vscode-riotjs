import { getState } from "../state";

export default function removeRiotDocument(
    filePath: string
) {
    const {
        riotDocuments,
        tsLanguageService
    } = getState();

    tsLanguageService.removeDocument(filePath);
    riotDocuments.delete(filePath);

    return filePath;
}