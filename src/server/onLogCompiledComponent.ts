import getCompiledComponent from "./getCompiledComponent";
import getDocumentFilePath from "./getDocumentFilePath";

import { getState } from "./state";

namespace onLogCompiledComponent {
    export type Args = {
        uri: string
    };
}

export default async function onLogCompiledComponent({
    uri
}: onLogCompiledComponent.Args) {
    const {
        connection,
        documents
    } = getState();

    const document = documents.get(uri);
    if (!document) {
        connection.console.error(`Document "${uri}" not found`);
        return;
    }

    const compiledComponent = getCompiledComponent(document);

    if (compiledComponent == null) {
        connection.console.error("Couldn't parse riot component");
        return;
    }

    connection.console.log(
        `Script content of "${getDocumentFilePath(document)}":\n` +
        `\`\`\`\n${compiledComponent.code}\n\`\`\`\n`
    );
}