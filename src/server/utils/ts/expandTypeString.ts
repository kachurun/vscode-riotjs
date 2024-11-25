import ts from "typescript";

import getFullyQualifiedTypeName from "./getFullyQualifiedTypeName";
import getParamsTypeStringOfSignature from "./getParamsTypeStringOfSignature";
import getTypeWithFilteredUndefined from "./getTypeWithFilteredUndefined";
import isPropertyAccessibleViaDotSyntax from "./isPropertyAccessibleViaDotSyntax";
import isTypeReference from "./isTypeReference";

export default function expandTypeString(
    type: ts.Type,
    typeChecker: ts.TypeChecker,
    currentSourceFile: ts.SourceFile,
    seen = new Map<number, string>()
): string {
    const typeId = (type as any).id;
    if (seen.has(typeId)) {
        return seen.get(typeId)!;
    }

    // Handle union types
    if (type.isUnion()) {
        const typeString = type.types
            .map(t => expandTypeString(t, typeChecker, currentSourceFile, seen))
            .join(' | ');
        seen.set(typeId, typeString);
        return typeString;
    }

    // Handle intersection types
    if (type.isIntersection()) {
        const typeString = type.types
            .map(t => expandTypeString(t, typeChecker, currentSourceFile, seen))
            .join(' & ');
        seen.set(typeId, typeString);
        return typeString;
    }

    // Handle function types
    if (type.getCallSignatures().length > 0) {
        const signatures = type.getCallSignatures();
        const typeString = signatures.map(sig => {
            const params = getParamsTypeStringOfSignature(sig, currentSourceFile, typeChecker, seen);

            const returnType = typeChecker.getReturnTypeOfSignature(sig);
            return `((${params}) => ${expandTypeString(returnType, typeChecker, currentSourceFile, seen)})`;
        }).join(' & ');
        seen.set(typeId, typeString);
        return typeString;
    }

    // Handle generic types
    if (isTypeReference(type)) {
        const baseName = getFullyQualifiedTypeName(type, typeChecker, currentSourceFile, seen);
        const args = typeChecker.getTypeArguments(type)
            .map(t => expandTypeString(t, typeChecker, currentSourceFile, seen))
            .join(', ');
        const typeString = `${baseName}${args !== "" ? `<${args}>` : "" }`;
        seen.set(typeId, typeString);
        return typeString;
    }
    if (type.aliasTypeArguments) {
        const baseName = getFullyQualifiedTypeName(type, typeChecker, currentSourceFile, seen);
        const args = type.aliasTypeArguments
            .map(t => expandTypeString(t, typeChecker, currentSourceFile, seen))
            .join(', ');
        const typeString = `${baseName}${args !== "" ? `<${args}>` : "" }`;
        seen.set(typeId, typeString);
        return typeString;
    }

    // Handle array types
    if (typeChecker.isArrayType(type)) {
        const elementType = (type as any).typeArguments[0];
        const typeString = `${expandTypeString(elementType, typeChecker, currentSourceFile, seen)}[]`;
        seen.set(typeId, typeString);
        return typeString;
    }

    // Handle tuple types
    if (typeChecker.isTupleType(type)) {
        const elementTypes = (type as any).typeArguments;
        const typeString = `[${elementTypes.map((t: ts.Type) => 
            expandTypeString(t, typeChecker, currentSourceFile, seen)
        ).join(', ')}]`;
        seen.set(typeId, typeString);
        return typeString;
    }

    if (type.isClassOrInterface() || (type.getFlags() & ts.TypeFlags.Object) !== 0) {
        const properties = typeChecker.getPropertiesOfType(type);
        if (properties.length === 0) {
            const baseType = getFullyQualifiedTypeName(type, typeChecker, currentSourceFile, seen);
            const typeString = baseType !== 'Object' ? baseType : '{}';
            seen.set(typeId, typeString);
            return typeString;
        }

        const members = properties.map(prop => {
            const propertyName = isPropertyAccessibleViaDotSyntax(prop.name) ? prop.name : `"${prop.name}"`;

            const isOptional = (prop.flags & ts.SymbolFlags.Optional) !== 0;
            const propType = (isOptional ?
                getTypeWithFilteredUndefined(
                    typeChecker.getTypeOfSymbolAtLocation(
                        prop,
                        prop.valueDeclaration!
                    )
                ) : 
                typeChecker.getTypeOfSymbolAtLocation(
                    prop,
                    prop.valueDeclaration!
                )
            );

            if (
                ts.isMethodDeclaration(prop.valueDeclaration!) ||
                ts.isMethodSignature(prop.valueDeclaration!)
            ) {
                const signature = typeChecker.getSignatureFromDeclaration(prop.valueDeclaration);
                if (signature) {
                    const params = getParamsTypeStringOfSignature(signature, currentSourceFile, typeChecker, seen);

                    const returnType = typeChecker.getReturnTypeOfSignature(signature);
                    return `${propertyName}${isOptional ? "?" : ""}(${params}): ${expandTypeString(returnType, typeChecker, currentSourceFile, seen)}`;
                }
            }

            return `${propertyName}${isOptional ? "?" : ""}: ${expandTypeString(propType, typeChecker, currentSourceFile, seen)}`;
        });

        const typeString = `{ ${members.join('; ')} }`;
        seen.set(typeId, typeString);
        return typeString;
    }

    // Get fully qualified name for other types
    const typeString = getFullyQualifiedTypeName(type, typeChecker, currentSourceFile, seen);
    seen.set(typeId, typeString);
    return typeString;
}