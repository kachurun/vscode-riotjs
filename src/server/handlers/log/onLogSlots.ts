import getDocument from "../../core/getDocument";

import touchRiotDocument from "../../core/riot-documents/touch";

import { getState } from "../../core/state";

import uriToPath from "../../utils/document/uriToPath";

import extractSlotNodes from "../../utils/node/extractSlotNodes";

import getEmbeddedComponentSourceFilePath from "../../utils/riot/getEmbeddedComponentSourceFilePath";

namespace onLogSlots {
    export type Args = {
        uri: string
    };
}

function onLogSlots({
    uri
}: onLogSlots.Args) {
    const {
        connection,
        tsLanguageService
    } = getState();

    const document = getDocument(uri);
    if (document == null) {
        connection.console.error(`Document "${uri}" not found`);
        return;
    }

    const filePath = uriToPath(document.uri);
    const riotDocument = touchRiotDocument(
        filePath, () => document.getText()
    );
    if (riotDocument == null) {
        connection.console.error(`Couldn't parse component for "${filePath}" file`);
        return;
    }

    const parserResult = riotDocument.getParserResult();
 
    const slotNodes = extractSlotNodes(parserResult.output.template);

    connection.console.log(JSON.stringify(slotNodes, null, 2));
}

export default onLogSlots;