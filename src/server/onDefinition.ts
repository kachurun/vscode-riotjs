import {
    Definition,
    DefinitionLink,
    DefinitionParams,
    Location
} from "vscode-languageserver/node";

import isInsideScript from "../utils/isInsideScript";

import getDefinitions from "./getDefinitions";
import getUriFromPath from "./getUriFromPath";
import parsedRiotDocuments from "./parsedRiotDocuments";
import touchRiotDocument from "./touchRiotDocument";

import { getState } from "./state";

export default async function onDefinition(
    params: DefinitionParams
): Promise<(
    Definition | DefinitionLink[] |
    undefined | null
)> {
    const {
        connection,
        documents,
        tsLanguageService
    } = getState();

    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return null;
    }

    const filePath = touchRiotDocument(document);
    const parsedDocument = parsedRiotDocuments.get(filePath);

    if (!isInsideScript(
        document, params.position,
        parsedDocument?.output || null
    )) {
        return null;
    }

    const definitions = getDefinitions({
        document, position: params.position,
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