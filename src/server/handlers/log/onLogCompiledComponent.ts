import getDocument from "../../core/getDocument";

import { getState } from "../../core/state";

import getCompiledComponent from "../../features/riot/getCompiledComponent";

import uriToPath from "../../utils/document/uriToPath";

namespace onLogCompiledComponent {
    export type Args = {
        uri: string
    };
}

export default async function onLogCompiledComponent({
    uri
}: onLogCompiledComponent.Args) {
    const {
        connection
    } = getState();

    const document = getDocument(uri);
    if (!document) {
        connection.console.error(`Document "${uri}" not found`);
        return;
    }

    const filePath = uriToPath(document.uri);
    const compiledComponent = getCompiledComponent(
        filePath, () => document.getText()
    );

    if (compiledComponent == null) {
        connection.console.error("Couldn't parse riot component");
        return;
    }

    connection.console.log(
        `Compiled component of "${filePath}":\n` +
        `\`\`\`\n${compiledComponent.code}\n\`\`\`\n`
    );
}