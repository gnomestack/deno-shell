import {
    chmod,
    chmodSync,
    IS_WINDOWS,
    makeTempFile,
    makeTempFileSync,
    writeTextFile,
    writeTextFileSync,
} from "./deps.ts";

export function generateScriptFileSync(script: string, ext: string, tpl?: string) {
    const scriptFile = makeTempFileSync({ prefix: "quasar_scripts", suffix: ext });
    if (tpl) {
        writeTextFileSync(scriptFile, tpl.replace("{{script}}", script));
    } else {
        writeTextFileSync(scriptFile, script);
    }

    if (!IS_WINDOWS) {
        chmodSync(scriptFile, 0o777);
    }

    return scriptFile.replaceAll("\\", "/");
}

export async function generateScriptFile(script: string, ext: string, tpl?: string) {
    const scriptFile = await makeTempFile({ prefix: "quasar_scripts", suffix: ext });
    if (tpl) {
        await writeTextFile(scriptFile, tpl.replace("{{script}}", script));
    } else {
        await writeTextFile(scriptFile, script);
    }

    if (!IS_WINDOWS) {
        await chmod(scriptFile, 0o777);
    }

    return scriptFile.replaceAll("\\", "/");
}
