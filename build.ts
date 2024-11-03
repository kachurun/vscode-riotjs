import * as esbuild from "esbuild";
import * as fs from "fs";
import * as path from "path";
import ts from "typescript";

// List of Node.js built-in modules that should remain external
const nodeBuiltins = [
    'assert', 'buffer', 'child_process', 'cluster', 'console', 'constants',
    'crypto', 'dgram', 'dns', 'domain', 'events', 'fs', 'http', 'https',
    'module', 'net', 'os', 'path', 'perf_hooks', 'process', 'punycode',
    'querystring', 'readline', 'repl', 'stream', 'string_decoder', 'sys',
    'timers', 'tls', 'tty', 'url', 'util', 'v8', 'vm', 'zlib'
];

// Dependencies that should remain external (not bundled)
const externalDeps = [
    'vscode'
];


function findPackageJSON (pkgName: string, searchDir: string): { external: boolean, resolved: string} | null {
    const filePath = require.resolve(`${pkgName}`, {
        paths: [searchDir]
    });
    if (filePath === pkgName) {
        return { external: true, resolved: filePath };
    }
    const basePkgRegex = new RegExp(`node_modules[\\\\\\\/]+${
        pkgName.replaceAll(/[\\\/]/g, "[\\\\\\\/]+")
    }`, "g");
    const regexMatches = filePath.matchAll(basePkgRegex)
    let lastMatch: RegExpExecArray | null = null;
    while (true) {
        const currentMatch = regexMatches.next();
        if (currentMatch.done) {
            break;
        }
        lastMatch = currentMatch.value;
    }
    if (lastMatch == null) {
        console.log({
            pkgName, filePath,
            basePkgRegex,
            lastMatch
        });
        return null;
    }

    let baseDir = filePath.substring(0, lastMatch.index + lastMatch[0].length);
    let possiblePositions = pkgName.split(/[\\\/]/).length;
    while (--possiblePositions >= 0) {
        const packageJSONPath = path.join(baseDir, "package.json");
        if (fs.existsSync(packageJSONPath)) {
            return { external: false, resolved: packageJSONPath };
        }
        baseDir = path.dirname(baseDir);
    }
    return null;
};

function resolvePackage(packageName: string, resolveDir: string): { external: true, path?: any } | { external: false, path: string } | null {
    try {
        const resolvedPackageJSON = findPackageJSON(packageName, resolveDir);
        if (!resolvedPackageJSON) {
            throw new Error(`Could not find package.json for ${packageName}`);
        }
        if (resolvedPackageJSON.external) {
            return { external: true };
        }

        const packageJSONPath = resolvedPackageJSON.resolved;

        const packageDir = path.dirname(packageJSONPath);
        const packageJson = JSON.parse(fs.readFileSync(packageJSONPath, 'utf8'));
        
        // Get the subpath if this is a subpackage
        const subPath = packageName.slice(packageName.indexOf('/'));
        const basePath = subPath === '/' ? '' : path.dirname(subPath);
        
        // Try to resolve in this order
        const entryPoints = [
            packageJson.module,
            packageJson.es2015,
            packageJson.esm,
            packageJson.main
        ].filter(Boolean); // Remove undefined/null entries

        for (const entryPoint of entryPoints) {
            // For subpackages, we need to check if the entry point exists in the subpath
            const fullPath = path.join(packageDir, basePath, entryPoint);
            if (fs.existsSync(fullPath)) {
                return { external: false, path: fullPath };
            }
        }

        // If no entry points worked, fall back to require.resolve
        return { external: false, path: require.resolve(packageName, { paths: [resolveDir] }) };
    } catch (e) {
        console.warn(`Failed to resolve package ${packageName}:`, e.message);
        return null;
    }
}

async function build() {
    const commonConfig: esbuild.BuildOptions = {
        bundle: true,
        platform: "node",
        target: "node14",
        format: "cjs",
        sourcemap: true,
        minify: false,
        external: [...nodeBuiltins, ...externalDeps],
        resolveExtensions: ['.ts', '.js', '.json', '.node'],
        mainFields: ['module', 'es2015', 'esm', 'main'],
        conditions: ['module', 'import', 'default'],
        plugins: [{
            name: 'resolve-deps',
            setup(build) {
                // Handle node: protocol imports
                build.onResolve({ filter: /^node:/ }, args => {
                    return { external: true }
                })

                // Handle package imports
                build.onResolve({ filter: /^[^./]/ }, async args => {
                    // Skip external dependencies
                    if (
                        nodeBuiltins.includes(args.path) || 
                        nodeBuiltins.includes(args.path.replace(/^node:/, '')) ||
                        externalDeps.includes(args.path)
                    ) {
                        return { external: true }
                    }
                    
                    return resolvePackage(args.path, args.resolveDir);
                })

                // Handle relative imports
                build.onResolve({ filter: /^\.{1,2}[/\\]/ }, args => {
                    // console.log(`Resolving: ${args.path}`);
                    try {
                        // Try to resolve with extensions in order
                        const extensions = ['.ts', '.js', '.json', '.node'];
                        const basePath = path.resolve(args.resolveDir, args.path);
                        for (const ext of extensions) {
                            const pathWithExt = basePath + ext;
                            if (fs.existsSync(pathWithExt)) {
                                return { path: pathWithExt }
                            }
                        }

                        // If no file found with extensions, try as directory with index files
                        if (fs.existsSync(basePath) && fs.statSync(basePath).isDirectory()) {
                            for (const ext of extensions) {
                                const indexPath = path.join(basePath, 'index' + ext);
                                if (fs.existsSync(indexPath)) {
                                    return { path: indexPath }
                                }
                            }
                        }

                        // If all resolution attempts fail, let esbuild try
                        return null
                    } catch (e) {
                        console.error(`Resolution error for ${args.path}: ${e}`);
                        return null
                    }
                })
            }
        }]
    };

    try {
        // Ensure build directory exists
        if (!fs.existsSync("build")) {
            fs.mkdirSync("build");
        }

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

        // Copy typescript libs
        const typescriptLibPath = path.dirname(ts.sys.getExecutingFilePath());
        fs.readdirSync(typescriptLibPath).forEach(fileName => {
            if (!fileName.startsWith("lib.")) {
                return;
            }
            const fromLocation = path.join(typescriptLibPath, fileName);
            const toLocation = path.join("build", fileName);
            fs.copyFileSync(fromLocation, toLocation);
        });

        console.log("Build completed successfully!");
    } catch (error) {
        console.error("Build failed:", error);
        process.exit(1);
    }
}

build();
