import {
    Hover,
    HoverParams
} from "vscode-languageserver/node";

import getDocument from "./getDocument";
import getDocumentFilePath from "./getDocumentFilePath";
import getHoverInfo from "./getHoverInfo";

import touchRiotDocument from "./riot-documents/touch";

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
    const riotDocument = touchRiotDocument(filePath, () => document.getText());
    if (riotDocument == null) {
        return null;
    }

    const offset = document.offsetAt(position);

    const contentType = getContentTypeAtOffset(
        offset, riotDocument.getParserResult()
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