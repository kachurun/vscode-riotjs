import {
    Definition,
    DefinitionLink,
    DefinitionParams,
    Location
} from "vscode-languageserver/node";

import { getState } from "./state";
import isInsideScript from "../utils/isInsideScript";
import getDefinitions from "./getDefinitions";
import getUriFromPath from "./getUriFromPath";

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

    if (!isInsideScript(document, params.position)) {
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