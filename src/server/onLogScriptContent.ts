import extractScriptContent from "./extractScriptContent";
import pathFromUri from "./pathFromUri";

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

    const { content } = extractScriptContent(document);
    connection.console.log(
        `Script content of "${pathFromUri(document.uri)}":\n` +
        `\`\`\`\n${content}\n\`\`\`\n`
    );
}