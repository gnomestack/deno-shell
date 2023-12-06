import { exec, execSync, run } from "./mod.ts";
import { assert, test } from "./deps.dev.ts";
import { chmod, findExeSync, IS_WINDOWS, NotFoundOnPathException } from "./deps.ts";

test("bash_exec", async () => {
    const { code, stdoutLines } = await exec("bash", "echo 'hello world'", { stdout: "piped" });
    assert.ok(code === 0);
    assert.ok(stdoutLines[0] === "hello world");
});

test("bash_run", async () => {
    if (!IS_WINDOWS) {
        await chmod("./resources/hello.sh", 0o777);
    }

    const { code, stdoutLines } = await run("bash", "./resources/hello.sh", { stdout: "piped" });
    assert.ok(code === 0);
    assert.ok(stdoutLines[0] === "Hello, nurse!");
});

test("bash_exec_with_env", async () => {
    const { code, stdoutLines } = await exec("bash", 'echo "$MSG"', { stdout: "piped", env: { MSG: "hello world" } });
    assert.ok(code === 0);
    assert.ok(stdoutLines[0] === "hello world");
});

test("bash_execSync", () => {
    const { code, stdoutLines } = execSync("bash", "echo 'hello world'", { stdout: "piped" });
    assert.ok(code === 0);
    assert.ok(stdoutLines[0] === "hello world");
});

test("sh_exec", async () => {
    const { code, stdoutLines } = await exec("sh", "echo 'hello world'", { stdout: "piped" });
    assert.ok(code === 0);
    assert.ok(stdoutLines[0] === "hello world");
});

test("sh_execSync", () => {
    const { code, stdoutLines } = execSync("sh", "echo 'hello world'", { stdout: "piped" });
    assert.ok(code === 0);
    assert.ok(stdoutLines[0] === "hello world");
});

test("pwsh_exec", async () => {
    const { code, stdoutLines } = await exec("pwsh", "Write-Host 'hello world'", { stdout: "piped" });
    assert.ok(code === 0);
    assert.ok(stdoutLines[0] === "hello world");
});

test("pwsh_execSync", () => {
    const { code, stdoutLines } = execSync("pwsh", "Write-Host 'hello world'", { stdout: "piped" });
    assert.ok(code === 0);
    assert.ok(stdoutLines[0] === "hello world");
});

test("pwsh_error_throws_and_stops", () => {
    // by default, powershell will throw when it hits an error using execSync
    const { code, stdoutLines, stderrLines } = execSync("pwsh", "Get-Command shizzle; Write-Host 'next'", {
        stdout: "piped",
        stderr: "piped",
    });
    assert.ok(code !== 0);
    assert.ok(stdoutLines.length === 0);
    assert.ok(stderrLines.length > 0);
});

test.when(IS_WINDOWS, "powershell_exec", async () => {
    const { code, stdoutLines } = await exec("powershell", "Write-Host 'hello world'", { stdout: "piped" });
    assert.ok(code === 0);
    assert.ok(stdoutLines[0] === "hello world");
});

test.when(IS_WINDOWS, "powershell_execSync", () => {
    const { code, stdoutLines } = execSync("powershell", "Write-Host 'hello world'", { stdout: "piped" });
    assert.ok(code === 0);
    assert.ok(stdoutLines[0] === "hello world");
});

test.when(!IS_WINDOWS, "powershell_throws", async () => {
    const e = await assert.rejects(async () =>
        await exec("powershell", "Write-Host 'hello world'", { stdout: "piped" })
    );
    assert.isError(e, NotFoundOnPathException);
});

test.when(IS_WINDOWS, "cmd_exec", async () => {
    const { code, stdoutLines } = await exec("cmd", "echo hello world", { stdout: "piped" });
    assert.ok(code === 0);
    assert.ok(stdoutLines[0] === "hello world");
});

test.when(IS_WINDOWS, "cmd_execSync", () => {
    const { code, stdoutLines } = execSync("cmd", "echo hello world", { stdout: "piped" });
    assert.ok(code === 0);
    assert.ok(stdoutLines[0] === "hello world");
});

test.when(IS_WINDOWS, "cmd_run", async () => {
    const { code } = await run("cmd", "./resources/broken command.cmd");
    assert.ok(code === 0);
});

const hasNode = findExeSync("node") !== undefined;
const hasRuby = findExeSync("ruby") !== undefined;
const hasPython = findExeSync("python") !== undefined;
const hasPerl = findExeSync("perl") !== undefined;
const hasDotnetScript = findExeSync("dotnet-script") !== undefined;

test("deno_exec", async () => {
    const { code, stdoutLines } = await exec("deno", "console.log('hello world');", { stdout: "piped" });
    assert.ok(code === 0);
    assert.ok(stdoutLines[0] === "hello world");
});

test("deno_execSync", () => {
    const { code, stdoutLines } = execSync("deno", "console.log('hello world');", { stdout: "piped" });
    assert.ok(code === 0);
    assert.ok(stdoutLines[0] === "hello world");
});

test.when(hasNode, "node_exec", async () => {
    const { code, stdoutLines } = await exec("node", "console.log('hello world');", { stdout: "piped" });
    assert.ok(code === 0);
    assert.ok(stdoutLines[0] === "hello world");
});

test.when(hasNode, "node_execSync", () => {
    const { code, stdoutLines } = execSync("node", "console.log('hello world')", { stdout: "piped" });
    assert.ok(code === 0);
    assert.ok(stdoutLines[0] === "hello world");
});

test.when(hasRuby, "ruby_exec", async () => {
    const { code, stdoutLines } = await exec("ruby", "puts 'hello world'", { stdout: "piped" });
    assert.ok(code === 0);
    assert.ok(stdoutLines[0] === "hello world");
});

test.when(hasRuby, "ruby_execSync", () => {
    const { code, stdoutLines } = execSync("ruby", "puts 'hello world'", { stdout: "piped" });
    assert.ok(code === 0);
    assert.ok(stdoutLines[0] === "hello world");
});

test.when(hasPython, "python_exec", async () => {
    const { code, stdoutLines } = await exec("python", "print('hello world')", { stdout: "piped" });
    assert.ok(code === 0);
    assert.ok(stdoutLines[0] === "hello world");
});

test.when(hasPython, "python_execSync", () => {
    const { code, stdoutLines } = execSync("python", "print('hello world')", { stdout: "piped" });
    assert.ok(code === 0);
    assert.ok(stdoutLines[0] === "hello world");
});

test.when(hasPerl, "perl_exec", async () => {
    const { code, stdoutLines } = await exec("perl", "print 'hello world'", { stdout: "piped" });
    assert.ok(code === 0);
    assert.ok(stdoutLines[0] === "hello world");
});

test.when(hasPerl, "perl_execSync", () => {
    const { code, stdoutLines } = execSync("perl", "print 'hello world'", { stdout: "piped" });
    assert.ok(code === 0);
    assert.ok(stdoutLines[0] === "hello world");
});

test.when(hasDotnetScript, "dotnet-script_exec", async () => {
    const { code, stdoutLines } = await exec("dotnet-script", 'Console.WriteLine("hello world");', { stdout: "piped" });
    assert.ok(code === 0);
    assert.ok(stdoutLines[0] === "hello world");
});

test.when(hasDotnetScript, "dotnet-script_execSync", () => {
    const { code, stdoutLines } = execSync("dotnet-script", 'Console.WriteLine("hello world");', { stdout: "piped" });
    assert.ok(code === 0);
    assert.ok(stdoutLines[0] === "hello world");
});
