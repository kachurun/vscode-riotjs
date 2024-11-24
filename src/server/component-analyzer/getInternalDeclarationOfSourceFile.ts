import * as ts from 'typescript';

import { getState } from '../core/state';

export default function getInternalDeclarationOfSourceFile(
    sourceFile: ts.SourceFile,
    program: ts.Program
): string | null {
    const { connection: { console } } = getState();

    let declarationText: string | null = null;
    const emitResult = program.emit(
        sourceFile,
        (fileName, text) => {
            declarationText = text;
        },
        undefined,
        true,
        undefined
    );

    if (emitResult.diagnostics.length > 0) {
        console.error(
            ts.formatDiagnosticsWithColorAndContext(emitResult.diagnostics, {
                getCanonicalFileName: (fileName) => fileName,
                getCurrentDirectory: ts.sys.getCurrentDirectory,
                getNewLine: () => ts.sys.newLine,
            })
        );
        return null;
    }

    if (declarationText == null) {
        console.error(`Couldn't generate declaration`);
        return null;
    }

    return declarationText;
}