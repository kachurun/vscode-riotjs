import parseContent from "./utils/riot-parser/parseContent";

import compiledComponents from "./compiledComponents";
import componentDeclarations from "./componentDeclarations";
import parsedRiotDocuments from "./parsedRiotDocuments";

import { getState } from "./state";
import { Position } from "vscode-languageserver-textdocument";

export default function updateRiotDocument(
    filePath: string,
    content: string
) {
    const {
        tsLanguageService
    } = getState();

    try {
        const parsedContent = parseContent(content);

        let scriptPosition: Position | null;
        if (
            parsedContent.output.javascript != null &&
            parsedContent.output.javascript.text != null
        ) {
            const contentBeforeScript = content.substring(
                0, parsedContent.output.javascript.text.start
            );
            const lines = contentBeforeScript.split("\n");
            scriptPosition = {
                line: lines.length - 1,
                character: lines.at(-1)!.length - 1
            };

            tsLanguageService.updateDocument(
                filePath,
                parsedContent.output.javascript.text.text
            );
        } else {
            scriptPosition = null;

            tsLanguageService.removeDocument(filePath)
        }

        parsedRiotDocuments.set(filePath, {
            result: parsedContent,
            scriptPosition
        });
    } catch (error) {
        // here will be some diagnostics
        tsLanguageService.removeDocument(filePath);
        parsedRiotDocuments.delete(filePath);
    }

    [
        ...tsLanguageService.getRootFilesDependantOf(filePath),
        ...tsLanguageService.getRootFilesDependantOf(`${filePath}.d.ts`)
    ].forEach(rootFilePath => {
        componentDeclarations.delete(rootFilePath);
    });

    componentDeclarations.delete(filePath);
    compiledComponents.delete(filePath);
    return filePath;
}