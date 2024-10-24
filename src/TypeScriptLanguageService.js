"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var ts = require("typescript");
var path = require("path");
var fs = require("fs");
var TypeScriptLanguageService = /** @class */ (function () {
    function TypeScriptLanguageService(options) {
        if (options === void 0) { options = {}; }
        var _a;
        this.currentDirectory = this.normalizePath((_a = options.currentDirectory) !== null && _a !== void 0 ? _a : process.cwd());
        this.compilerOptions = __assign(__assign({}, TypeScriptLanguageService.defaultCompilerOptions), options.compilerOptions);
        this.documents = new Map();
        this.libFolder = this.normalizePath(path.dirname(require.resolve('typescript/lib/lib.d.ts')));
        this.languageService = this.createLanguageService();
    }
    TypeScriptLanguageService.prototype.normalizePath = function (filePath) {
        // Convert backslashes to forward slashes and resolve relative paths
        return filePath.split(path.sep).join('/');
    };
    TypeScriptLanguageService.prototype.createLanguageService = function () {
        var compilerHost = ts.createCompilerHost(this.compilerOptions);
        var servicesHost = this.createServiceHost(compilerHost);
        return ts.createLanguageService(servicesHost);
    };
    TypeScriptLanguageService.prototype.createServiceHost = function (compilerHost) {
        var _this = this;
        return {
            getScriptFileNames: function () { return Array.from(_this.documents.keys()); },
            getScriptVersion: function (fileName) {
                var normalizedFileName = _this.normalizePath(fileName);
                return (_this.documents.has(normalizedFileName) ?
                    "".concat(_this.documents.get(normalizedFileName).version) : "0");
            },
            getScriptSnapshot: function (fileName) { return _this.getFileSnapshot(fileName); },
            getScriptKind: function (fileName) { return _this.getScriptKind(fileName); },
            getCurrentDirectory: function () { return _this.currentDirectory; },
            getCompilationSettings: function () { return _this.compilerOptions; },
            getDefaultLibFileName: function (options) {
                var libPath = ts.getDefaultLibFilePath(options);
                return _this.normalizePath(libPath);
            },
            fileExists: function (fileName) { return _this.doesFileExist(fileName); },
            readFile: function (fileName) { return _this.readFileContent(fileName); },
            readDirectory: function (path, extensions, exclude, include, depth) {
                var results = compilerHost.readDirectory(path, extensions || [], exclude, include || [], depth);
                return results.map(function (result) { return _this.normalizePath(result); });
            },
        };
    };
    TypeScriptLanguageService.prototype.getScriptKind = function (fileName) {
        var normalizedFileName = this.normalizePath(fileName);
        var ext = path.extname(normalizedFileName);
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
    };
    TypeScriptLanguageService.prototype.getFileSnapshot = function (fileName) {
        var normalizedFileName = this.normalizePath(fileName);
        var content = this.readFileContent(normalizedFileName);
        if (!content) {
            return undefined;
        }
        return ts.ScriptSnapshot.fromString(content);
    };
    TypeScriptLanguageService.prototype.doesFileExist = function (fileName) {
        var normalizedFileName = this.normalizePath(fileName);
        if (this.documents.has(normalizedFileName)) {
            return true;
        }
        if (fs.existsSync(normalizedFileName)) {
            return true;
        }
        var libFile = this.tryGetLibFile(normalizedFileName);
        return libFile !== null;
    };
    TypeScriptLanguageService.prototype.readFileContent = function (fileName) {
        var normalizedFileName = this.normalizePath(fileName);
        // Check in-memory documents
        var inMemoryDocument = this.documents.get(normalizedFileName);
        if (inMemoryDocument) {
            return inMemoryDocument.content;
        }
        // Check filesystem
        if (fs.existsSync(normalizedFileName)) {
            try {
                return fs.readFileSync(normalizedFileName, 'utf-8');
            }
            catch (_a) {
                return undefined;
            }
        }
        // Check lib files
        var libFileName = this.tryGetLibFile(normalizedFileName);
        if (!libFileName) {
            return undefined;
        }
        try {
            return fs.readFileSync(libFileName, 'utf-8');
        }
        catch (_b) {
            return undefined;
        }
    };
    TypeScriptLanguageService.prototype.tryGetLibFile = function (fileName) {
        var normalizedFileName = this.normalizePath(fileName);
        if (!normalizedFileName.includes(this.libFolder)) {
            return null;
        }
        var baseName = path.basename(normalizedFileName);
        if (baseName.startsWith('lib.')) {
            return null;
        }
        var libFileName = this.normalizePath(path.join(this.libFolder, "lib.".concat(baseName)));
        if (!fs.existsSync(libFileName)) {
            return null;
        }
        return libFileName;
    };
    TypeScriptLanguageService.prototype.updateDocument = function (fileName, content) {
        var normalizedFileName = this.normalizePath(fileName);
        if (this.documents.has(normalizedFileName)) {
            var document_1 = this.documents.get(normalizedFileName);
            document_1.content = content;
            document_1.version++;
            this.documents.set(normalizedFileName, document_1);
        }
        else {
            this.documents.set(normalizedFileName, {
                content: content,
                version: 0
            });
        }
    };
    TypeScriptLanguageService.prototype.removeDocument = function (fileName) {
        var normalizedFileName = this.normalizePath(fileName);
        this.documents.delete(normalizedFileName);
    };
    TypeScriptLanguageService.prototype.getCompletionsAtPosition = function (fileName, position) {
        var normalizedFileName = this.normalizePath(fileName);
        var completionInfo = this.languageService.getCompletionsAtPosition(normalizedFileName, position, {
            includeCompletionsForModuleExports: true,
            includeCompletionsWithInsertText: true,
        });
        // if (completionInfo && completionInfo.entries) {
        //   completionInfo.entries.forEach(entry => {
        //     if (entry.kind === ts.ScriptElementKind.alias) {
        //       const details = this.languageService.getCompletionEntryDetails(
        //         normalizedFileName,
        //         position,
        //         entry.name,
        //         undefined,
        //         entry.source,
        //         undefined,
        //         undefined
        //       );
        //       if (details) {
        //         entry.kind = details.kind;
        //       }
        //     }
        //   });
        // }
        if (!completionInfo) {
            return [];
        }
        return completionInfo.entries.map(function (entry) { return ({
            name: entry.name,
            kind: entry.kind,
            sortText: entry.sortText,
            insertText: entry.insertText
        }); });
    };
    TypeScriptLanguageService.defaultCompilerOptions = {
        target: ts.ScriptTarget.Latest,
        module: ts.ModuleKind.CommonJS,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        lib: ['lib.es2015.d.ts', 'lib.dom.d.ts'],
        allowJs: true,
        checkJs: true,
        strict: true,
        allowNonTsExtensions: true
    };
    return TypeScriptLanguageService;
}());
exports.default = TypeScriptLanguageService;
// const service = new TypeScriptLanguageService();
// const cursor = "|$|$|$|";
// let code, cursorPosition;
// code = `
// class User {
//   name: string
//   doSomething() {
//     ${cursor}
//   }
// }`;
// cursorPosition = code.indexOf(cursor);
// code = code.replace(cursor, "");
// const fileName = "test.riot";
// service.updateDocument(fileName, code);
// console.log(service.getCompletionsAtPosition(fileName, cursorPosition).slice(0, 5));
// code = `
// class User {
//   name: string
//   doSomething() {
//     this.${cursor}
//   }
// }`;
// cursorPosition = code.indexOf(cursor);
// code = code.replace(cursor, "");
// service.updateDocument(fileName, code);
// debugger;
// console.log(service.getCompletionsAtPosition(fileName, cursorPosition).slice(0, 5));
