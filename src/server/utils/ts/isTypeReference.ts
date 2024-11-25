import ts from "typescript";

export default function isTypeReference(type: ts.Type): type is ts.TypeReference {
    return (
        (type as ts.TypeReference).typeArguments !== undefined &&
        (type as ts.TypeReference).target !== undefined
    );
}