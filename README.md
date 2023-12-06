# Gnomestack Shell for Deno

Work less. Do more.

![logo](./.eng/assets/icon.png)

Run shell files or inline scripts from deno. The registered script/shells
are:

- bash
- sh
- powershell
- pwsh
- deno (typescript)
- node
- ruby
- python
- perl
- dotnet-script (csharp csx files)

```typescript
import { exec, execSync, run } from "https://deno/land/x/gs_shell@0.0.0/mod.ts";

// run an inline script
{
    const { code, stdoutLines } = await exec("bash", "echo 'hello world'", { stdout: "piped" });
    console.log(code, stdoutLines)
}

// run an inlinc script synchronously
{
    const r = execSync("bash", "echo \"$MSG\"", { stdout: "piped", env: {MSG: "hello, bob" } });
    const { code, stdoutLines } = r;
    console.log(code, stdoutLines);
    r.throwOrContinue();
}

// run a shell file
{
     const r = await run("bash", "./file.sh");
     r.throwOrContinue();
}

```

## License

MIT
