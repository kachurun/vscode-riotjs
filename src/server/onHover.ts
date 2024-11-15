import {
    Hover,
    HoverParams
} from "vscode-languageserver/node";

import getHoverInfo from "./getHoverInfo";
import parsedRiotDocuments from "./parsedRiotDocuments";
import touchRiotDocument from "./touchRiotDocument";

import { getState } from "./state";

import getContentTypeAtOffset from "./utils/getContentTypeAtOffset";

export default function onHover(
    {
        textDocument,
        position
    }: HoverParams
): Hover | undefined | null {
    const {
        connection,
        documents,
        tsLanguageService
    } = getState()

    const document = documents.get(textDocument.uri);
    if (!document) {
        return null;
    }

    const filePath = touchRiotDocument(document);
    const parsedDocument = parsedRiotDocuments.get(filePath);
    if (parsedDocument == null) {
        return null;
    }

    const contentType = getContentTypeAtOffset(
        document.offsetAt(position), parsedDocument
    );
    if (contentType == null) {
        return null;
    }

    switch (contentType) {
        case "javascript": {
            return getHoverInfo({
                document, position: position,
                tsLanguageService, connection
            });
        }
        default: {
            return null;
        }
    }
}