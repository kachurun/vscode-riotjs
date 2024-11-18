import { compile } from "@riotjs/compiler";
import { TextDocument } from "vscode-languageserver-textdocument";

import compiledComponents from "./compiledComponents";
import parsedRiotDocuments from "./parsedRiotDocuments";
import touchRiotDocument from "./touchRiotDocument";

import { getState } from "./state";

export default function getCompiledComponent(
    document: TextDocument
) {
    const filePath = touchRiotDocument(document);
    if (parsedRiotDocuments.get(filePath) == null) {
        return null;
    }

    try {
        const compiledComponent = compile(document.getText());
        compiledComponents.set(filePath, compiledComponent);
        return compiledComponent;
    } catch (error) {
        getState().connection.console.log(`Error: ${error}`);
    }
    return null;
}