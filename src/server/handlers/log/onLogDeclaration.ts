import getDocument from "../../core/getDocument";

import { getState } from "../../core/state";

import getComponentDeclaration from "../../features/riot/getComponentDeclaration";

import uriToPath from "../../utils/document/uriToPath";

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
        connection
    } = getState();

    const document = getDocument(uri);
    if (!document) {
        connection.console.error(`Document "${uri}" not found`);
        return;
    }

    const filePath = uriToPath(document.uri);
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