import ts from "typescript";

import expandTypeString from "./expandTypeString";
import getTypeWithFilteredUndefined from "./getTypeWithFilteredUndefined";

export default function getParamsTypeStringOfSignature(
    signature: ts.Signature,
    currentSourceFile: ts.SourceFile,
    typeChecker: ts.TypeChecker,
    seen: Map<number, string>
) {
    return signature.getParameters().map(param => {
        const declaration = param.valueDeclaration! as ts.ParameterDeclaration;
        const isOptional =
            declaration.initializer != null ||
            declaration.questionToken != null ||
            (param.getFlags() & ts.SymbolFlags.Optional) !== 0;
        const isRestParameter = ts.isParameter(declaration) && !!declaration.dotDotDotToken;

        const paramType = (isOptional ?
            getTypeWithFilteredUndefined(
                typeChecker.getTypeOfSymbolAtLocation(
                    param,
                    param.valueDeclaration!
                )
            ) :
            typeChecker.getTypeOfSymbolAtLocation(
                param,
                param.valueDeclaration!
            )
        );
        return `${isRestParameter ? "..." : ""}${param.getName()}${isOptional ? "?" : ""}: ${expandTypeString(
            paramType, typeChecker, currentSourceFile, seen
        )}`;
    }).join(', ');
}