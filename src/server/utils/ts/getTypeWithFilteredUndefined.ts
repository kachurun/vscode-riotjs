import ts from "typescript";

export default function getTypeWithFilteredUndefined(
    type: ts.Type
) {
    if (!type.isUnion()) {
        return type;
    }

    const filteredTypes = type.types.filter(type => {
        return (type.flags & ts.TypeFlags.Undefined) === 0;
    });
    if (filteredTypes.length === type.types.length) {
        return type;
    }

    if (filteredTypes.length === 1) {
        return filteredTypes[0];
    }

    return type;
}