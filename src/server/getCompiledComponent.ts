import { compile } from "@riotjs/compiler";
import { TextDocument } from "vscode-languageserver-textdocument";

import compiledComponents from "./compiledComponents";
import parsedRiotDocuments from "./parsedRiotDocuments";
import touchRiotDocument from "./touchRiotDocument";

import { getState } from "./state";

export default function getCompiledComponent(
    filePath: string,
    getText: () => string
) {
    touchRiotDocument(filePath, getText);
    if (parsedRiotDocuments.get(filePath) == null) {
        return null;
    }

    try {
        const compiledComponent = compile(getText());
        compiledComponents.set(filePath, compiledComponent);
        return compiledComponent;
    } catch (error) {
        getState().connection.console.error(`Error: ${error}`);
    }
    return null;
}