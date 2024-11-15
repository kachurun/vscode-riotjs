import type { SourceFile } from "typescript";

import { getState } from "./state";

export default async function onLogProgramFiles() {
    const {
        connection,
        tsLanguageService
    } = getState();

    const program = tsLanguageService.getProgram();
    if (program == null) {
        connection.console.log("No program");
        return;
    }

    const rootFileNames = program.getRootFileNames();

    connection.console.log("Root files:");
    rootFileNames.forEach(rootFileName => {
        connection.console.log(rootFileName);
    });

    const rootSourceFiles: Array<SourceFile> = [];

    connection.console.log("Source files:");
    program.getSourceFiles().forEach(sourceFile => {
        if (rootFileNames.includes(sourceFile.fileName)) {
            rootSourceFiles.push(sourceFile);
        }
        connection.console.log(sourceFile.fileName);
    });
}