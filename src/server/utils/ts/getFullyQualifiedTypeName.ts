import ts from "typescript";
import path from "path";
import getImportPathRelativeToSource from "./getImportPathRelativeToSourceFile";

export default function getFullyQualifiedTypeName(
    type: ts.Type,
    typeChecker: ts.TypeChecker,
    currentSourceFile: ts.SourceFile,
    seen = new Map<number, string>()
): string {
    const typeId = (type as any).id;
    if (seen.has(typeId)) {
        return seen.get(typeId)!;
    }

    // Handle intrinsic types (e.g., string, number)
    if (
        type.getFlags() & (
            ts.TypeFlags.String |
            ts.TypeFlags.Number |
            ts.TypeFlags.Boolean
        )
    ) {
        const typeString = typeChecker.typeToString(type);
        seen.set(typeId, typeString);
        return typeString;
    }

    // Get the symbol and declarations
    const aliasSymbol = type.aliasSymbol;
    const symbol = type.getSymbol();

    const consideringSymbol = aliasSymbol || symbol;
    if (
        !consideringSymbol ||
        !consideringSymbol.declarations ||
        consideringSymbol.declarations.length === 0 ||
        consideringSymbol.declarations.some(decl => {
            return (
                ts.isTypeLiteralNode(decl) ||
                ts.isMappedTypeNode(decl)
            );
        })
    ) {
        if (aliasSymbol) {
            const typeString = aliasSymbol.name;
            seen.set(typeId, typeString);
            return typeString;
        }
        const typeString = typeChecker.typeToString(type);
        seen.set(typeId, typeString);
        return typeString;
    }

    const declaration = consideringSymbol.declarations[0];
    const sourceFile = declaration.getSourceFile();
    const sourceFileName = sourceFile.fileName;
    
    // Handle built-in or TypeScript library types
    const typescriptLibFolder = path.dirname(ts.sys.getExecutingFilePath().replaceAll(/[\\\/]+/g, "/"));
    if (sourceFile.isDeclarationFile && sourceFile.fileName.includes(typescriptLibFolder)) {
        const aliasSymbol = type.aliasSymbol;
        if (aliasSymbol) {
            const typeString = aliasSymbol.name;
            seen.set(typeId, typeString);
            return typeString;
        }
        const typeString = consideringSymbol.name;
        seen.set(typeId, typeString);
        return typeString;
    }

    // Handle imported types
    const importPath = getImportPathRelativeToSource(sourceFileName, currentSourceFile.fileName);

    if (importPath) {
        const typeString = `import("${importPath}").${consideringSymbol.name}`;
        seen.set(typeId, typeString);
        return typeString;
    }

    const typeString = consideringSymbol.name;
    seen.set(typeId, typeString);
    return typeString;
}