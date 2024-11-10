import {
    Hover,
    HoverParams
} from "vscode-languageserver/node";

import isInsideScript from "../utils/isInsideScript";

import getHoverInfo from "./getHoverInfo";

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

    if (isInsideScript(document, params.position)) {
        return getHoverInfo({
            document, position: params.position,
            tsLanguageService, connection
        });
    }
    return null;
}