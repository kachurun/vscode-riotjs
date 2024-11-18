import getDeclarationOfSourceFile from "./getDeclarationOfSourceFile";
import parsedRiotDocuments from "./parsedRiotDocuments";
import touchRiotDocument from "./touchRiotDocument";

import { getState } from "./state";

namespace onLogDeclaration {
    export type Args = {
        uri: string
    };
}

const basicRiotComponentDeclaration = [
    `declare const _default: import("riot").RiotComponentWrapper<(`,
    `    import("riot").RiotComponent<Record<string, any>, {`,
    `        [x: string]: any;`,
    `        [x: symbol]: any;`,
    `    }>`,
    `)>;`,
    `export default _default;`
].join("\n");

export default async function onLogDeclaration({
    uri
}: onLogDeclaration.Args) {
    const {
        connection,
        documents,
        tsLanguageService
    } = getState();

    const document = documents.get(uri);
    if (!document) {
        connection.console.error(`Document "${uri}" not found`);
        return;
    }

    const filePath = touchRiotDocument(document);
    const parsedRiotDocument = parsedRiotDocuments.get(filePath);
    if (parsedRiotDocument == null) {
        connection.console.error(`Document "${uri}" cannot be parsed`);
        return;
    }

    if (parsedRiotDocument.output.javascript == null) {
        connection.console.log(`Document "${uri}" declaration:\n${basicRiotComponentDeclaration}`);
        return;
    }
    
    const sourceFile = tsLanguageService.getSourceFile(filePath);
    if (sourceFile == null) {
        connection.console.log(`Document "${uri}" declaration:\n${basicRiotComponentDeclaration}`);
        return;
    }
    
    const declaration = getDeclarationOfSourceFile(sourceFile, tsLanguageService.getProgram());
    if (declaration == null) {
        connection.console.log(`Document "${uri}" declaration:\n${basicRiotComponentDeclaration}`);
        return;
    }

    connection.console.log(`Document "${uri}" declaration:\n${declaration}`);
}