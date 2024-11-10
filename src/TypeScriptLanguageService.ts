import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';

interface ServiceOptions {
    currentDirectory?: string;
    compilerOptions?: ts.CompilerOptions;
}

export default class TypeScriptLanguageService {
    private languageService: ts.LanguageService | null = null;
    private documents: Map<string, {
        content: string,
        version: number
    }>;
    private libFolder: string;
    private currentDirectory: string;
    private compilerOptions: ts.CompilerOptions;

    private static defaultCompilerOptions: ts.CompilerOptions = {
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.NodeNext,
        allowJs: true,
        checkJs: true,
        strict: true,
        allowNonTsExtensions: true
    };

    constructor(options: ServiceOptions = {}) {
        this.currentDirectory = this.normalizePath(options.currentDirectory ?? process.cwd());
        this.compilerOptions = {
            ...TypeScriptLanguageService.defaultCompilerOptions,
            ...options.compilerOptions
        };

        this.documents = new Map();
        this.libFolder = this.normalizePath(path.dirname(ts.sys.getExecutingFilePath()));
        console.log({ libFolder: this.libFolder });
        this.languageService = this.createLanguageService();
    }

    private normalizePath(filePath: string) {
        return filePath.split(path.sep).join('/');
    }

    private createLanguageService(): ts.LanguageService {
        const compilerHost = ts.createCompilerHost(this.compilerOptions);
        const servicesHost = this.createServiceHost(compilerHost);
        return ts.createLanguageService(servicesHost);
    }

    private createServiceHost(compilerHost: ts.CompilerHost): ts.LanguageServiceHost {
        return {
            getScriptFileNames: () => Array.from(this.documents.keys()),
            getScriptVersion: (fileName) => this.getScriptVersion(fileName),
            getScriptSnapshot: (fileName) => this.getFileSnapshot(fileName),
            getScriptKind: (fileName) => this.getScriptKind(fileName),
            getCurrentDirectory: () => this.currentDirectory,
            getCompilationSettings: () => this.compilerOptions,
            getDefaultLibFileName: (options) => {
                const libPath = ts.getDefaultLibFilePath(options);
                console.log({ libPath });
                return this.normalizePath(libPath);
            },
            fileExists: (fileName) => this.doesFileExist(fileName),
            readFile: (fileName) => this.readFileContent(fileName),
            readDirectory: (path, extensions, exclude, include, depth) => {
                const results = compilerHost.readDirectory!(
                    path, extensions || [], exclude, include || [], depth
                );
                return results.map(result => this.normalizePath(result));
            },
            resolveModuleNames: (moduleNames, containingFile, _, __, options) => {
                return moduleNames.map(moduleName => {
                    const result = ts.resolveModuleName(
                        moduleName,
                        containingFile,
                        this.compilerOptions,
                        {
                            fileExists: fileName => this.doesFileExist(fileName),
                            readFile: fileName => this.readFileContent(fileName),
                        }
                    );
                    
                    return result.resolvedModule;
                    // console.log(`Module "${moduleName}" not resolved`);
    
                    // // Fall back to trying to resolve relative to the containing file
                    // const candidate = path.join(path.dirname(containingFile), moduleName);
                    // if (this.doesFileExist(candidate)) {
                    //     return {
                    //         resolvedFileName: candidate,
                    //         isExternalLibraryImport: false,
                    //         extension: path.extname(candidate) as ts.Extension
                    //     };
                    // }
    
                    // return undefined;
                });
            },
            getDirectories: compilerHost.getDirectories?.bind(compilerHost)
        };
    }

    private getScriptVersion(fileName: string): string {
        const normalizedFileName = this.normalizePath(fileName);

        if (this.documents.has(normalizedFileName)) {
            return `${this.documents.get(normalizedFileName)!.version}`;
        }

        try {
            if (fs.existsSync(normalizedFileName)) {
                return fs.statSync(normalizedFileName).mtimeMs.toString();
            }
        } catch (e) {
            console.warn(`Error accessing file ${normalizedFileName}:`, e);
        }

        return "0";
    }

    private getScriptKind(fileName: string): ts.ScriptKind {
        const normalizedFileName = this.normalizePath(fileName);
        const ext = path.extname(normalizedFileName);

        // Handle known extensions
        switch (ext.toLowerCase()) {
            case '.ts':
                return ts.ScriptKind.TS;
            case '.tsx':
                return ts.ScriptKind.TSX;
            case '.js':
                return ts.ScriptKind.JS;
            case '.jsx':
                return ts.ScriptKind.JSX;
            case '.json':
                return ts.ScriptKind.JSON;
            default: {
                // If it's in-memory and has an unknown extension, treat as JS
                if (this.documents.has(normalizedFileName)) {
                    return ts.ScriptKind.TS;
                }
                return ts.ScriptKind.Unknown;
            }
        }
    }

    private getFileSnapshot(fileName: string) {
        const normalizedFileName = this.normalizePath(fileName);
        const content = this.readFileContent(normalizedFileName);
        if (!content) {
            return undefined;
        }

        return ts.ScriptSnapshot.fromString(content);
    }

    private doesFileExist(fileName: string) {
        const normalizedFileName = this.normalizePath(fileName);

        if (this.documents.has(normalizedFileName)) {
            return true;
        }

        if (fs.existsSync(normalizedFileName)) {
            return true;
        }

        const libFile = this.tryGetLibFile(normalizedFileName);
        return libFile !== null;
    }

    private readFileContent(fileName: string) {
        const normalizedFileName = this.normalizePath(fileName);

        // Check in-memory documents
        const inMemoryDocument = this.documents.get(normalizedFileName);
        if (inMemoryDocument) {
            return inMemoryDocument.content;
        }

        // Check filesystem
        if (fs.existsSync(normalizedFileName)) {
            try {
                return fs.readFileSync(normalizedFileName, 'utf-8');
            } catch {
                return undefined;
            }
        }

        // Check lib files
        const libFileName = this.tryGetLibFile(normalizedFileName);
        if (!libFileName) {
            return undefined;
        }

        try {
            return fs.readFileSync(libFileName, 'utf-8');
        } catch {
            return undefined;
        }
    }

    private tryGetLibFile(fileName: string) {
        const normalizedFileName = this.normalizePath(fileName);

        if (!normalizedFileName.includes(this.libFolder)) {
            return null;
        }

        const baseName = path.basename(normalizedFileName);
        if (baseName.startsWith('lib.')) {
            return null;
        }

        const libFileName = this.normalizePath(path.join(this.libFolder, `lib.${baseName}`));
        if (!fs.existsSync(libFileName)) {
            return null;
        }

        return libFileName;
    }

    public updateDocument(fileName: string, content: string) {
        console.log(`Updating document "${fileName}"`);
        const normalizedFileName = this.normalizePath(fileName);
        if (this.documents.has(normalizedFileName)) {
            const document = this.documents.get(normalizedFileName)!;
            document.content = content;
            document.version++;
            this.documents.set(normalizedFileName, document);
        } else {
            this.documents.set(normalizedFileName, {
                content, version: 0
            });
        }
    }

    public removeDocument(fileName: string) {
        const normalizedFileName = this.normalizePath(fileName);
        this.documents.delete(normalizedFileName);
    }

    public getCompletionsAtPosition(
        fileName: string,
        position: number
    ) {
        if (this.languageService == null) {
            return undefined;
        }
        const normalizedFileName = this.normalizePath(fileName);
        const completionInfo = this.languageService.getCompletionsAtPosition(
            normalizedFileName,
            position,
            {
                includeCompletionsForModuleExports: true,
                includeCompletionsWithInsertText: true,
                includeAutomaticOptionalChainCompletions: true,
                includeCompletionsWithObjectLiteralMethodSnippets: true,
                includeCompletionsWithClassMemberSnippets: true
            }
        );

        return completionInfo;
    }

    getCompletionEntryDetails(
        fileName,
        position,
        completionEntryName,
        formatOptions,
        source,
        preferences,
        data
    ) {
        return this.languageService?.getCompletionEntryDetails(
            this.normalizePath(fileName),
            position,
            completionEntryName,
            formatOptions,
            source,
            preferences,
            data
        );
    }
    getCompletionEntrySymbol(
        fileName,
        position,
        completionEntryName,
        formatOptions
    ) {
        return this.languageService?.getCompletionEntrySymbol(
            this.normalizePath(fileName),
            position,
            completionEntryName,
            formatOptions
        );
    }

    getQuickInfoAtPosition(
        fileName: string, position: number
    ) {
        return this.languageService?.getQuickInfoAtPosition(
            this.normalizePath(fileName),
            position
        );
    }

    getDefinitionAtPosition(fileName: string, position: number) {
        return this.languageService?.getDefinitionAtPosition(fileName, position);
    }

    getTypeDefinitionAtPosition(fileName: string, position: number) {
        return this.languageService?.getTypeDefinitionAtPosition(fileName, position);
    }

    public dispose() {
        if (!this.languageService) {
            return;
        }
        this.languageService.dispose();
        this.documents.clear();
        this.languageService = null;
    }

    public getProgram() {
        return this.languageService?.getProgram();
    }
}