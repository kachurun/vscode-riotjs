import ts from "typescript";

export default function getDefaultExportedType(
    sourceFile: ts.SourceFile,
    typeChecker: ts.TypeChecker
) {
    let type: ts.Type | undefined;

    function onNode(node: ts.Node) {
        // Handle export default expression
        if (!ts.isExportAssignment(node) || node.isExportEquals) {
            return false;
        }

        const expression = node.expression;
        // Get the type of the exported expression directly
        type = typeChecker.getTypeAtLocation(expression);
        return true;
    }

    function walkNode(node: ts.Node) {
        if (onNode(node)) {
            return true;
        }

        ts.forEachChild(node, walkNode);
    }

    walkNode(sourceFile);
    return type;
}