let lastPrompt: string | null = null;

(self as any).Module = {
    locateFile: (path: string) =>
        path.endsWith(".wasm") ? `${self.location.origin}/lite.wasm` : path,
    print: (text: string) => self.postMessage({ type: "print", data: text }),
    printErr: (text: string) => {
        if (text.includes("stdio streams")) return;
        self.postMessage({ type: "printErr", data: text });
    },
    onRuntimeInitialized: () => {
        (self as any).__printPrompt = (cwd: string) => {
            lastPrompt = cwd;
            self.postMessage({ type: "prompt", data: cwd });
        };
        self.postMessage({ type: "fs:ready" });
    },
};

self.addEventListener("message", (e: MessageEvent) => {
    const { type } = e.data;
    
    if (e.data.type === "ready") {
        fetch("/lite.js")
            .then(r => r.text())
            .then(code => eval(`var Module = self.Module;\n${code}`));
    } else if (type === "input" && (self as any).__requestLine) {
        (self as any).__requestLine(e.data.data);
        (self as any).__requestLine = null;
    } else if (type === "fs:request") {
        const { id, op, path } = e.data;
        const FS = (self as any).Module?.FS;
        if (!FS) return;

        try {
            let result;
            if (op === "readdir") result = FS.readdir(path);
            else if (op === "stat") {
                const s = FS.stat(path);
                result = { mode: s.mode };
            }
            else if (op === "readFile") result = FS.readFile(path, { encoding: "utf8" });
            else if (op === "mkdir") FS.mkdir(path);
            else if (op === "writeFile") {
                FS.writeFile(path, e.data.data);
            }
            self.postMessage({ type: "fs:result", id, result });
        } catch (err: any) {
            self.postMessage({ type: "fs:result", id, result: null, error: err.message });
        }
    } else if (type === "fs:ping") {
        const FS = (self as any).Module?.FS;
        if (FS) self.postMessage({ type: "fs:ready" });
    } else if (type === "terminal:connect") {
        if (lastPrompt !== null) self.postMessage({ type: "prompt", data: lastPrompt });
    } else if (type === "fs:initialized") {
        self.postMessage({ type: "fs:initialized" });
    }
});