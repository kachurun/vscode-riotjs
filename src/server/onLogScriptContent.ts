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
        connection,
        documents
    } = getState();

    const document = documents.get(uri);
    if (!document) {
        connection.console.log(`Document "${uri}" not found`);
        return;
    }

    const filePath = touchRiotDocument(document);
    const parsedDocument = parsedRiotDocuments.get(filePath);

    if (parsedDocument == null) {
        connection.console.log("Couldn't parse riot component");
        return;
    }

    if (
        parsedDocument.output.javascript == null ||
        parsedDocument.output.javascript.text == null
    ) {
        connection.console.log("No script content found");
        return;
    }

    connection.console.log(
        `Script content of "${filePath}":\n` +
        `\`\`\`\n${
            parsedDocument.output.javascript.text.text
        }\n\`\`\`\n`
    );
}