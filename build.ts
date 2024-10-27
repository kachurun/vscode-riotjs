import * as esbuild from "esbuild";
import * as fs from "fs";
import * as path from "path";

// List of Node.js built-in modules
const nodeBuiltins = [
    'assert', 'buffer', 'child_process', 'cluster', 'console', 'constants',
    'crypto', 'dgram', 'dns', 'domain', 'events', 'fs', 'http', 'https',
    'module', 'net', 'os', 'path', 'perf_hooks', 'process', 'punycode',
    'querystring', 'readline', 'repl', 'stream', 'string_decoder', 'sys',
    'timers', 'tls', 'tty', 'url', 'util', 'v8', 'vm', 'zlib'
];

async function build() {
    const commonConfig = {
        bundle: true,
        platform: "node" as const,
        target: "node14" as const,
        format: "cjs" as const,
        sourcemap: true,
        minify: false,
        external: [
            'vscode',
            // Node.js built-in modules
            ...nodeBuiltins,
            // VS Code language server modules
            'vscode-languageclient',
            'vscode-languageserver',
            'vscode-languageserver-textdocument',
            'vscode-css-languageserver-bin',
            'vscode-html-languageservice',
            'vscode-uri'
        ],
    };

    try {
        // Ensure build directory exists
        if (!fs.existsSync("build")) {
            fs.mkdirSync("build");
        }

        // Copy package.json to build folder with modified main
        const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
        packageJson.main = "./extension.js";
        fs.writeFileSync(
            path.join("build", "package.json"),
            JSON.stringify(packageJson, null, 2)
        );

        // Bundle extension
        await esbuild.build({
            ...commonConfig,
            entryPoints: ["src/extension.ts"],
            outfile: "build/extension.js",
        });

        // Bundle server
        await esbuild.build({
            ...commonConfig,
            entryPoints: ["src/server.ts"],
            outfile: "build/server.js",
        });

        console.log("Build completed successfully!");
    } catch (error) {
        console.error("Build failed:", error);
        process.exit(1);
    }
}

build();
