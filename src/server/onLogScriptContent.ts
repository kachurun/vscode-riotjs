import getDocument from "./getDocument";
import getDocumentFilePath from "./getDocumentFilePath";
import parsedRiotDocuments from "./parsedRiotDocuments";
import touchRiotDocument from "./touchRiotDocument";

import { getState } from "./state";

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
    touchRiotDocument(filePath, () => document.getText());
    const parsedDocument = parsedRiotDocuments.get(filePath);

    if (parsedDocument == null) {
        connection.console.error("Couldn't parse riot component");
        return;
    }

    const { result: parserResult } = parsedDocument;
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