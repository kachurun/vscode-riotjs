import {
    Hover,
    HoverParams
} from "vscode-languageserver/node";

import getDocument from "./getDocument";
import getDocumentFilePath from "./getDocumentFilePath";
import getHoverInfo from "./getHoverInfo";
import parsedRiotDocuments from "./parsedRiotDocuments";
import touchRiotDocument from "./touchRiotDocument";

import getContentTypeAtOffset from "./utils/getContentTypeAtOffset";

export default function onHover(
    {
        textDocument,
        position
    }: HoverParams
): Hover | undefined | null {
    const document = getDocument(textDocument.uri);
    if (!document) {
        return null;
    }

    const filePath = getDocumentFilePath(document);
    touchRiotDocument(filePath, () => document.getText());
    const parsedDocument = parsedRiotDocuments.get(filePath);
    if (parsedDocument == null) {
        return null;
    }

    const offset = document.offsetAt(position);

    const contentType = getContentTypeAtOffset(
        offset, parsedDocument.result
    );
    if (contentType == null) {
        return null;
    }

    switch (contentType) {
        case "javascript": {
            return getHoverInfo({
                filePath,
                getText: () => document.getText(),
                offset
            });
        }
        default: {
            return null;
        }
    }
}