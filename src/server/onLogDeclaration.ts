import getComponentDeclaration from "./getComponentDeclaration";
import getDocumentFilePath from "./getDocumentFilePath";

import { getState } from "./state";

namespace onLogDeclaration {
    export type Args = {
        uri: string,
        type: "INTERNAL" | "EXTERNAL"
    };
}

export default async function onLogDeclaration({
    uri, type
}: onLogDeclaration.Args) {
    const {
        connection,
        documents
    } = getState();

    const document = documents.get(uri);
    if (!document) {
        connection.console.error(`Document "${uri}" not found`);
        return;
    }

    const filePath = getDocumentFilePath(document);
    const componentDeclaration = getComponentDeclaration(
        filePath, () => document.getText(), type
    );

    if (componentDeclaration == null) {
        connection.console.error(
            `Couldn't get component declaration of "${filePath}"`
        );
        return;
    }

    connection.console.log(
        `${{
            "INTERNAL": "Internal",
            "EXTERNAL": "External"
        }[type]} declaration of "${filePath}":\n` +
        `\`\`\`\n${componentDeclaration}\n\`\`\`\n`
    );
}