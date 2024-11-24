import {
    Definition,
    DefinitionLink,
    DefinitionParams,
    Location
} from "vscode-languageserver/node";

import getDefinitions from "./getDefinitions";
import getDocument from "./getDocument";
import getDocumentFilePath from "./getDocumentFilePath";
import getUriFromPath from "./getUriFromPath";

import touchRiotDocument from "./riot-documents/touch";

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
    )
    if (contentType !== "javascript") {
        return null;
    }

    const definitions = getDefinitions({
        filePath,
        getText: () => document.getText(),
        offset
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