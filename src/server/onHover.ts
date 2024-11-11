import {
    Hover,
    HoverParams
} from "vscode-languageserver/node";

import isInsideScript from "../utils/isInsideScript";

import getHoverInfo from "./getHoverInfo";
import parsedRiotDocuments from "./parsedRiotDocuments";
import touchRiotDocument from "./touchRiotDocument";

import { getState } from "./state";

export default function onHover(
    params: HoverParams
): Hover | undefined | null {
    const {
        connection,
        documents,
        tsLanguageService
    } = getState()

    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return null;
    }

    const filePath = touchRiotDocument(document);
    const parsedDocument = parsedRiotDocuments.get(filePath);

    if (isInsideScript(
        document, params.position,
        parsedDocument?.output || null
    )) {
        return getHoverInfo({
            document, position: params.position,
            tsLanguageService, connection
        });
    }
    return null;
}