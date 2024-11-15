import {
    Definition,
    DefinitionLink,
    DefinitionParams,
    Location
} from "vscode-languageserver/node";

import getDefinitions from "./getDefinitions";
import getUriFromPath from "./getUriFromPath";
import parsedRiotDocuments from "./parsedRiotDocuments";
import touchRiotDocument from "./touchRiotDocument";

import { getState } from "./state";

import getContentTypeAtOffset from "./utils/getContentTypeAtOffset";

export default async function onDefinition(
    {
        textDocument,
        position
    }: DefinitionParams
): Promise<(
    Definition | DefinitionLink[] |
    undefined | null
)> {
    const {
        connection,
        documents,
        tsLanguageService
    } = getState();

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
    )
    if (contentType !== "javascript") {
        return null;
    }

    const definitions = getDefinitions({
        document, position: position,
        tsLanguageService, connection
    }).map(({
        path, range,
        targetSelectionRange, originSelectionRange
    }) => ({
        uri: getUriFromPath(path),
        range,
        targetSelectionRange,
        originSelectionRange
    }));
    if (definitions.length === 0) {
        return null;
    }

    if (definitions.some(def => def.targetSelectionRange)) {
        return definitions.map(def => ({
            targetUri: def.uri,
            targetRange: def.range,
            targetSelectionRange: def.targetSelectionRange!,
            originSelectionRange: def.originSelectionRange
        }));
    }

    return definitions.map(def => Location.create(def.uri, def.range));
}