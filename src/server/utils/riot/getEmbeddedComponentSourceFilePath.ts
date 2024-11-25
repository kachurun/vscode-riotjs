import ts from "typescript";

export default function getEmbeddedComponentSourceFilePath(
    componentsProperty: ts.Type,
    typeChecker: ts.TypeChecker,
    componentKey: string
) {
    // Get the type of the components object
    const componentSymbol = componentsProperty.getProperties().find(
        componentSymbol => componentSymbol.name === componentKey
    );
    if (componentSymbol == null) {
        return undefined;
    }

    // Get the value declaration of the component
    const declaration = (
        componentSymbol.valueDeclaration ||
        componentSymbol.declarations?.[0]
    );

    if (
        !declaration ||
        !ts.isPropertyAssignment(declaration)
    ) {
        return undefined;
    }

    const symbol = typeChecker.getSymbolAtLocation(declaration.initializer);
    if (!symbol) {
        return undefined;
    }

    // Try to get the original declaration through imports
    const originalSymbol = typeChecker.getAliasedSymbol(symbol);
    const componentSourceFile = (
        originalSymbol?.declarations?.[0] ??
        symbol.declarations?.[0]
    )?.getSourceFile();
        
    return componentSourceFile?.fileName;
}