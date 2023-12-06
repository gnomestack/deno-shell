import {
    cwd,
    exec as exec2,
    execSync as execSync2,
    findExe,
    findExeSync,
    IExecOptions,
    IExecSyncOptions,
    InvalidOperationException,
    IPathFinderOptions,
    IS_WINDOWS,
    registerExe,
    resolve,
} from "./deps.ts";
import { generateScriptFile, generateScriptFileSync } from "./utils.ts";

export interface IShellOptions extends IPathFinderOptions {
    args?: string[];
    ext: string;
    generateScriptFile?: (script: string, ext: string, tpl?: string) => Promise<string>;
    generateScriptFileSync?: (script: string, ext: string, tpl?: string) => string;
    mapPath?: (path: string) => Promise<string>;
    mapPathSync?: (path: string) => string;
}

const registery: Record<string, IShellOptions | undefined> = {};

export function register(shell: string, options: Omit<IShellOptions, "name">) {
    const opts = registerExe(shell, options);
    const o = {
        ...options,
        ...opts,
    };
    registery[shell] = o;
}

export function options(shell: string): IShellOptions | undefined {
    return registery[shell];
}

export function list(): string[] {
    return Object.keys(registery);
}

export async function run(shell: string, file: string, execOptions?: IExecOptions & { args?: string[] }) {
    const o = options(shell);
    if (o === undefined) {
        throw new InvalidOperationException("${shell} not registered");
    }

    o.mapPath ??= (path: string) => { 
        path = resolve(cwd(), path);
        if (IS_WINDOWS) {
            path = path.replaceAll("\\", "/");
        }

        return Promise.resolve(path);
    };
    file = await o.mapPath(file);

    const splat = o.args?.concat([]) ?? [];
    splat.push(file);
    if (execOptions && execOptions.args) {
        splat.push(...execOptions.args);
        delete execOptions.args;
    }

    return await exec2(shell, splat, execOptions);
}

export function runSync(shell: string, file: string, execOptions?: IExecSyncOptions & { args?: string[] }) {
    const o = options(shell);
    if (o === undefined) {
        throw new InvalidOperationException("${shell} not registered");
    }

    const splat = o.args?.concat([]) ?? [];
    o.mapPathSync ??= (path: string) => { 
        path = resolve(cwd(), path);
        if (IS_WINDOWS) {
            path = path.replaceAll("\\", "/");
        }

        return path;
    };
    file = o.mapPathSync(file);

    splat.push(file);
    if (execOptions && execOptions.args) {
        splat.push(...execOptions.args);
        delete execOptions.args;
    }

    return execSync2(shell, splat, execOptions);
}

export async function exec(shell: string, inlineScript: string, execOptions?: IExecOptions) {
    const o = options(shell);
    if (o === undefined) {
        throw new InvalidOperationException("${shell} not registered");
    }

    const mkScript = o.generateScriptFile ?? generateScriptFile;
    const scriptFile = await mkScript(inlineScript, o.ext, undefined);
    return await run(shell, scriptFile, execOptions);
}

export function execSync(shell: string, inlineScript: string, execOptions?: IExecSyncOptions) {
    const o = options(shell);
    if (o === undefined) {
        throw new InvalidOperationException("${shell} not registered");
    }

    const mkScript = o.generateScriptFileSync ?? generateScriptFileSync;
    const scriptFile = mkScript(inlineScript, o.ext, undefined);
    return runSync(shell, scriptFile, execOptions);
}

register("bash", {
    ext: ".sh",
    args: ["-noprofile", "--norc", "-e", "-o", "pipefail", "-c"],
    windows: [
        "%ProgramFiles%\\Git\\bin\\bash.exe",
        "%ProgramFiles%\\Git\\usr\\bin\\bash.exe",
        "%ChocolateyInstall%\\msys2\\usr\\bin\\bash.exe",
        "%SystemDrive%\\msys64\\usr\\bin\\bash.exe",
        "%SystemDrive%\\msys\\usr\\bin\\bash.exe",
        "%SystemRoot%\\System32\\bash.exe",
    ],
    mapPath: async (path: string) => {
        path = resolve(cwd(), path);
        if (IS_WINDOWS) {
            path = path.replaceAll("\\", "/");
            const exe = await findExe("bash");
            if (exe?.endsWith("System32\\bash.exe") || exe?.endsWith("system32\\bash.exe")) {
                path = "/mnt/" + "c" + path.substring(1).replace(":", "");
            }
        }

        return path;
    },
    mapPathSync: (path: string) => {
        path = resolve(cwd(), path);
        if (IS_WINDOWS) {
            path = path.replaceAll("\\", "/");
            const exe = findExeSync("bash");
            if (exe?.endsWith("System32\\bash.exe") || exe?.endsWith("system32\\bash.exe")) {
                path = "/mnt/" + "c" + path.substring(1).replace(":", "");
            }
        }

        return path;
    },
});

register("powershell", {
    ext: ".ps1",
    args: ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Unrestricted", "-Command"],
    windows: [
        "%SystemRoot%/System32/WindowsPowerShell/v1.0/powershell.exe",
    ],
    mapPath: (path: string) => Promise.resolve(`. ${path}`),
    mapPathSync: (path: string) => `. ${path}`,
    generateScriptFile: async (script: string, ext: string, tpl?: string) => {
        script = `
$ErrorActionPreference = 'Stop'
${script}
if ((Test-Path -LiteralPath variable:\\LASTEXITCODE)) { exit $LASTEXITCODE }
        `;
        return await generateScriptFile(script, ext, tpl);
    },
    generateScriptFileSync: (script: string, ext: string, tpl?: string) => {
        script = `
$ErrorActionPreference = 'Stop'
${script}
if ((Test-Path -LiteralPath variable:\\LASTEXITCODE)) { exit $LASTEXITCODE }
        `;
        return generateScriptFileSync(script, ext, tpl);
    },
});

register("pwsh", {
    ext: ".ps1",
    args: ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Unrestricted", "-Command"],
    windows: [
        "%ProgramFiles%/PowerShell/7/pwsh.exe",
        "%ProgramFiles(x86)%/PowerShell/7/pwsh.exe",
        "%ProgramFiles%/PowerShell/6/pwsh.exe",
        "%ProgramFiles(x86)%/PowerShell/6/pwsh.exe",
    ],
    linux: [
        "/opt/microsoft/powershell/7/pwsh",
        "/opt/microsoft/powershell/6/pwsh",
    ],
    generateScriptFile: async (script: string, ext: string, tpl?: string) => {
        script = `
$ErrorActionPreference = 'Stop'
${script}
if ((Test-Path -LiteralPath variable:\\LASTEXITCODE)) { exit $LASTEXITCODE }
        `;
        return await generateScriptFile(script, ext, tpl);
    },
    generateScriptFileSync: (script: string, ext: string, tpl?: string) => {
        script = `
$ErrorActionPreference = 'Stop'
${script}
if ((Test-Path -LiteralPath variable:\\LASTEXITCODE)) { exit $LASTEXITCODE }
        `;
        return generateScriptFileSync(script, ext, tpl);
    },
    mapPath: (path: string) => Promise.resolve(`. ${resolve(cwd(), path)}`),
    mapPathSync: (path: string) => `. ${resolve(cwd(), path)}`,
});

register("cmd", {
    ext: ".cmd",
    args: ["/D", "/E:ON", "/V:OFF", "/S", "/C", "CALL"],
    windows: [
        "%SystemRoot%/System32/cmd.exe",
    ],
    generateScriptFile: async (script: string, ext: string, tpl?: string) => {
        script = `@echo off
${script}`;
        return await generateScriptFile(script, ext, tpl);
    },
    generateScriptFileSync: (script: string, ext: string, tpl?: string) => {
        script = `@echo off
${script}`;
        return generateScriptFileSync(script, ext, tpl);
    },
});

register("sh", {
    args: ["-e"],
    ext: ".sh",
    windows: [
        "%ProgramFiles%\\Git\\usr\\bin\\sh.exe",
        "%ChocolateyInstall%\\msys2\\usr\\bin\\sh.exe",
        "%SystemDrive%\\msys64\\usr\\bin\\sh.exe",
        "%SystemDrive%\\msys\\usr\\bin\\sh.exe",
    ],
});

register("deno", {
    args: ["run", "-A", "--unstable"],
    ext: ".ts",
    windows: [
        "%UserProfile%\\.deno\\bin\\deno.exe",
        "%ChocolateyInstall%\\lib\\deno\\tools\\deno.exe",
    ],
    linux: [
        "$HOME/.deno/bin/deno",
    ],
});

register("node", {
    args: [],
    ext: ".js",
    windows: [
        "%ProgramFiles%/nodejs/node.exe",
        "%ProgramFiles(x86)%/nodejs/node.exe",
    ],
    linux: [
        "/usr/bin/node",
    ],
});

register("python", {
    args: [],
    ext: ".py",
    linux: [
        "/usr/bin/python3",
        "/usr/bin/python",
    ],
});

register("ruby", {
    args: [],
    ext: ".rb",
    linux: [
        "/usr/bin/ruby",
    ],
});

register("perl", {
    args: [],
    ext: ".pl",
    linux: [
        "/usr/bin/perl",
    ],
});

register("dotnet-script", {
    args: [],
    ext: ".csx",
    linux: [
        "${HOME}/.dotnet/tools/dotnet-script",
    ],
    windows: [
        "%UserProfile%\\.dotnet\\tools\\dotnet-script.exe",
    ],
});
