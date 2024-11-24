import {
    Definition,
    DefinitionLink,
    DefinitionParams,
    Location
} from "vscode-languageserver/node";

import getDocument from "../../core/getDocument";

import touchRiotDocument from "../../core/riot-documents/touch";

import getDefinitions from "../../features/lsp/getDefinitions";

import getContentTypeAtOffset from "../../features/riot/getContentTypeAtOffset";

import uriToPath from "../../utils/document/uriToPath";
import pathToUri from "../../utils/document/pathToUri";

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
        uri: pathToUri(path),
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