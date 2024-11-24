import { compile, CompilerOutput } from "@riotjs/compiler";
import { Position } from "vscode-languageserver-textdocument"

import TypeScriptLanguageService from "../TypeScriptLanguageService";

import ParserResult from "./utils/riot-parser/ParserResult"
import parseContent from "./utils/riot-parser/parseContent";
import defaultRiotComponentDeclaration from "./defaultRiotComponentDeclaration";
import getInternalDeclarationOfSourceFile from "./getInternalDeclarationOfSourceFile";
import convertInternalDeclarationToExternal from "./convertInternalDeclarationToExternal";

export default class RiotDocument {
    private parserResult: ParserResult;
    private scriptPosition: null | Position = null;

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