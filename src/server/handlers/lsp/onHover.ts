import {
    Hover,
    HoverParams
} from "vscode-languageserver/node";

import getDocument from "../../core/getDocument";

import getHoverInfo from "../../features/lsp/getHoverInfo";

import getContentTypeAtOffset from "../../features/riot/getContentTypeAtOffset";

import touchRiotDocument from "../../riot-documents/touch";

import uriToPath from "../../utils/document/uriToPath";

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

    const filePath = uriToPath(document.uri);
    const riotDocument = touchRiotDocument(
        filePath, () => document.getText()
    );
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