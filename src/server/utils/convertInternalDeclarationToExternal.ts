import * as tsParser from "recast/parsers/typescript";

import { parse, print, types } from "recast";

export default function convertInternalDeclarationToExternal(
    internalDeclaration: string
): string | null {
    const ast = parse(internalDeclaration, {
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

    const { builders } = types;

    defaultDeclaration.typeAnnotation.typeAnnotation = builders.tsImportType(
        builders.stringLiteral("riot"),
        builders.identifier("RiotComponentWrapper"),
        builders.tsTypeParameterInstantiation([
            defaultDeclaration.typeAnnotation.typeAnnotation
        ])
    );

    return print(ast).code;
}