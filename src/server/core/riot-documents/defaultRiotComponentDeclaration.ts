const defaultRiotComponentDeclaration = [
    `declare const _default: import("riot").RiotComponent<`,
    `    Record<PropertyKey, any>, Record<PropertyKey, any>`,
    `>;`,
    `export default _default;`
].join("\n");

export default defaultRiotComponentDeclaration;