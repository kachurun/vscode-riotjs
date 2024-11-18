import * as ts from 'typescript';
import { getState } from './state';

import { parse, print, types } from "recast";
import * as tsParser from "recast/parsers/typescript";

export default function getDeclarationOfSourceFile(
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

    const ast = parse(declarationText, {
        parser: tsParser
    });
    const exportDefaultDeclaration = ast.program.body.find(statement => {
        return statement.type === "ExportDefaultDeclaration"
    });
    if (exportDefaultDeclaration == null) {
        console.error(`No export default found`);
        return null;
    }

    const { name } = exportDefaultDeclaration.declaration;
    if (name == null) {
        console.error(`Incomplete export default`);
        return null;
    }

    let defaultDeclaration: any = null;
    const findDefaultDeclaration = (currentNode) => {
        if (currentNode.type === "VariableDeclaration") {
            currentNode.declarations.some((node) => {
                findDefaultDeclaration(node);
                return defaultDeclaration != null;
            });
        } else if (currentNode.type === "VariableDeclarator") {
            findDefaultDeclaration(currentNode.id);
        } else if (currentNode.type === "Identifier") {
            if (currentNode.name === name) {
                defaultDeclaration = currentNode;
                return;
            }
        }
    }
    ast.program.body.some((node) => {
        findDefaultDeclaration(node);
        return defaultDeclaration != null;
    });

    if (defaultDeclaration == null) {
        console.error(`Couldn't find default exported value`);
        return null;
    }

    defaultDeclaration.typeAnnotation.typeAnnotation = types.builders.tsImportType(
        types.builders.stringLiteral("riot"),
        types.builders.identifier("RiotComponentWrapper"),
        types.builders.tsTypeParameterInstantiation([
            defaultDeclaration.typeAnnotation.typeAnnotation
        ])
    );

    return print(ast).code;
}