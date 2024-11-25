import { readFileSync } from "fs";

import getDocument from "../../core/getDocument";

import touchRiotDocument from "../../core/riot-documents/touch";

import pathToUri from "../document/pathToUri";

export default function getRiotDocumentByFilePath(
    filePath: string
) {
    const baseDocument = getDocument(pathToUri(
        filePath
    ));

    return touchRiotDocument(
        filePath,
        () => {
            if (baseDocument != null) {
                return baseDocument.getText();
            }

            return readFileSync(
                filePath,
                { encoding: "utf-8" }
            );
        }
    );
}