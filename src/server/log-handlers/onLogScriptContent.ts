import touchRiotDocument from "../riot-documents/touch";

import getDocument from "../core/getDocument";

import { getState } from "../core/state";

import getDocumentFilePath from "../utils/getDocumentFilePath";

namespace onLogScriptContent {
    export type Args = {
        uri: string
    };
}

export default async function onLogScriptContent({
    uri
}: onLogScriptContent.Args) {
    const {
        connection
    } = getState();

    const document = getDocument(uri);
    if (!document) {
        connection.console.error(`Document "${uri}" not found`);
        return;
    }

    const filePath = getDocumentFilePath(document);
    const riotDocument = touchRiotDocument(
        filePath, () => document.getText()
    );
    if (riotDocument == null) {
        connection.console.error("Couldn't parse riot component");
        return;
    }

    const parserResult = riotDocument.getParserResult();
    if (
        parserResult.output.javascript == null ||
        parserResult.output.javascript.text == null
    ) {
        connection.console.error("No script content found");
        return;
    }

    connection.console.log(
        `Script content of "${filePath}":\n` +
        `\`\`\`\n${
            parserResult.output.javascript.text.text
        }\n\`\`\`\n`
    );
}