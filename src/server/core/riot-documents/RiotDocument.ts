import ts from "typescript";

import { compile, CompilerOutput } from "@riotjs/compiler";
import { Position } from "vscode-languageserver-textdocument"

import TypeScriptLanguageService from "../../../TypeScriptLanguageService";

import getDefaultExportedType from "../../features/ts/getDefaultExportedType";
import getInternalDeclarationOfSourceFile from "../../features/ts/getInternalDeclarationOfSourceFile";

import convertInternalDeclarationToExternal from "../../utils/riot/convertInternalDeclarationToExternal";

import ParserResult from "../../utils/riot-parser/ParserResult"
import parseContent from "../../utils/riot-parser/parseContent";

import expandTypeString from "../../utils/ts/expandTypeString";
import getParamsTypeStringOfSignature from "../../utils/ts/getParamsTypeStringOfSignature";
import getTypeWithFilteredUndefined from "../../utils/ts/getTypeWithFilteredUndefined";
import isPropertyAccessibleViaDotSyntax from "../../utils/ts/isPropertyAccessibleViaDotSyntax";

import defaultRiotComponentDeclaration from "./defaultRiotComponentDeclaration";

export default class RiotDocument {
    private parserResult: ParserResult;
    private scriptPosition: null | Position = null;

    private componentProperties: Record<string, string> | null | undefined;
    private componentsProperty: ts.Type | null | undefined;
    
    private internalDeclaration: string | null = null;
    private externalDeclaration: string | null = null;

    private compiledDocument: CompilerOutput | null = null;

    constructor(
        readonly filePath: string,
        content: string,
        tsLanguageService: TypeScriptLanguageService,
        otherRiotDocuments: Map<string, RiotDocument>
    ) {
        this.update(content, tsLanguageService, otherRiotDocuments);
    }

    update(
        content: string,
        tsLanguageService: TypeScriptLanguageService,
        otherRiotDocuments: Map<string, RiotDocument>
    ) {
        this.compiledDocument = null;
        this.deprecateDeclaration(tsLanguageService, otherRiotDocuments);

        const parsedContent = parseContent(content);

        if (
            parsedContent.output.javascript != null &&
            parsedContent.output.javascript.text != null
        ) {
            const contentBeforeScript = content.substring(
                0, parsedContent.output.javascript.text.start
            );
            const lines = contentBeforeScript.split("\n");
            this.scriptPosition = {
                line: lines.length - 1,
                character: lines.at(-1)!.length - 1
            };

            tsLanguageService.updateDocument(
                this.filePath,
                parsedContent.output.javascript.text.text
            );
        } else {
            this.scriptPosition = null;

            tsLanguageService.removeDocument(this.filePath);
        }

        this.parserResult = parsedContent;

        return this;
    }

    deprecateDeclaration(
        tsLanguageService: TypeScriptLanguageService,
        otherRiotDocuments: Map<string, RiotDocument>
    ) {
        this.componentProperties = undefined;

        this.internalDeclaration = null;
        this.externalDeclaration = null;
        [
            ...tsLanguageService.getRootFilesDependantOf(this.filePath),
            ...tsLanguageService.getRootFilesDependantOf(`${this.filePath}.d.ts`)
        ].forEach(rootFilePath => {
            const dependantRiotDocument = otherRiotDocuments.get(rootFilePath);
            if (dependantRiotDocument == null) {
                return;
            }

            dependantRiotDocument.deprecateDeclaration(
                tsLanguageService, otherRiotDocuments
            );
        });

        return this;
    }

    getCompiled() {
        if (this.compiledDocument != null) {
            return this.compiledDocument;
        }

        const compiledComponent = compile(this.getContent());
        this.compiledDocument = compiledComponent;
        return compiledComponent;
    }

    getContent() {
        if (this.parserResult == null) {
            throw new Error("Invalid Riot Document");
        }

        return this.parserResult.data;
    }

    // should fallback to basic riot component properties!
    getComponentProperties(tsLanguageService: TypeScriptLanguageService) {
        if (this.componentProperties !== undefined) {
            return this.componentProperties;
        }

        this.componentsProperty = null;

        const sourceFile = tsLanguageService.getSourceFile(
            this.filePath
        );
        if (sourceFile == null) {
            return this.componentProperties = null;
        }

        const typeChecker = (
            tsLanguageService.getProgram().getTypeChecker()
        );

        const defaultExportedType = getDefaultExportedType(
            sourceFile, typeChecker
        );
        if (defaultExportedType == null) {
            return this.componentProperties = null;
        }

        const componentProperties: Record<string, string> = {};
        const seenTypes = new Map<number, string>();
        typeChecker.getPropertiesOfType(defaultExportedType).forEach(prop => {
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

            if (prop.name === "components") {
                this.componentsProperty = propType;
            }

            const declaration = (
                prop.valueDeclaration ||
                prop.declarations?.[0] ||
                null
            );

            if (
                declaration != null &&
                (
                    ts.isMethodDeclaration(declaration) ||
                    ts.isMethodSignature(declaration)
                )
            ) {
                const signature = (
                    propType.getCallSignatures()[0] ||
                    typeChecker.getSignatureFromDeclaration(declaration)
                );
                if (signature) {
                    const params = getParamsTypeStringOfSignature(signature, sourceFile, typeChecker, seenTypes);
    
                    const returnType = typeChecker.getReturnTypeOfSignature(signature);
                    componentProperties[prop.name] = (`${propertyName}${isOptional ? "?" : ""}(${params}): ${expandTypeString(returnType, typeChecker, sourceFile, seenTypes)}`);
                    return;
                }
            }

            componentProperties[prop.name] = `${propertyName}${isOptional ? "?" : ""}: ${expandTypeString(propType, typeChecker, sourceFile, seenTypes)}`;
        });
        return this.componentProperties = componentProperties;
    }

    getComponentsProperty(tsLanguageService: TypeScriptLanguageService) {
        if (this.componentsProperty !== undefined) {
            return this.componentsProperty;
        }

        this.getComponentProperties(tsLanguageService);
        return this.componentsProperty!;
    }

    getInternalDeclaration(tsLanguageService: TypeScriptLanguageService) {
        if (this.internalDeclaration != null) {
            return this.internalDeclaration;
        }

        if (this.parserResult.output.javascript == null) {
            return (
                this.internalDeclaration = defaultRiotComponentDeclaration
            );
        }

        tsLanguageService.restrictProgramToScripts(
            [ this.filePath, `${this.filePath}.d.ts` ]
        );
        const sourceFile = tsLanguageService.getSourceFile(this.filePath);
        if (sourceFile == null) {
            tsLanguageService.clearProgramRestriction();
            return (
                this.internalDeclaration = defaultRiotComponentDeclaration
            );
        }

        const internalDeclaration = getInternalDeclarationOfSourceFile(
            sourceFile, tsLanguageService.getProgram()
        ) || defaultRiotComponentDeclaration;
        tsLanguageService.clearProgramRestriction();
        this.internalDeclaration = internalDeclaration;

        return internalDeclaration;
    }

    getExternalDeclaration(tsLanguageService: TypeScriptLanguageService) {
        if (this.externalDeclaration != null) {
            return this.externalDeclaration;
        }
        const internalDeclaration = this.getInternalDeclaration(tsLanguageService);

        const externalDeclaration = convertInternalDeclarationToExternal(
            internalDeclaration
        );
        this.externalDeclaration = externalDeclaration;

        return externalDeclaration;
    }

    getParserResult() {
        return this.parserResult;
    }

    getScriptPosition() {
        return this.scriptPosition;
    }
}