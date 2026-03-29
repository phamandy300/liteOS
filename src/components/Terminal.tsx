import { Terminal as Term } from "@xterm/xterm";
import { useEffect, useRef, forwardRef } from "react";
import "@xterm/xterm/css/xterm.css";
import { FitAddon } from "@xterm/addon-fit";
import { useWorker } from "./em/WorkerContext";
import "./css/Window.css"

const Terminal = forwardRef((_, __) => {
    const termRef = useRef<HTMLDivElement>(null);
    const worker = useWorker();

    useEffect(() => {
        const term = new Term({
            allowTransparency: true,
            theme: { 
                background: "#00000000", 
                foreground: "#ffffff",
                cursor: "#ffffff",
                cursorAccent: "#000000",
            },
            fontFamily: '"JetBrainsMono NF", monospace',
            fontSize: 14,
            lineHeight: 1,
            cursorBlink: true,
        });

        const fit = new FitAddon();
        term.loadAddon(fit);
        term.open(termRef.current!);
        fit.fit();

        worker.onmessage = (e) => {
            const { type, data } = e.data;
            if (type === "print") term.write(data + "\r\n");
            else if (type === "printErr") term.write("\x1b[0m" + data + "\x1b[0m\r\n");
            else if (type === "prompt")
                term.write(
                    `\x1b[0m\x1b[48;5;31m\x1b[38;5;15m ~${data} \x1b[0m\x1b[38;5;31m\ue0b0\x1b[0m $ `
                );
        };

        worker.onerror = (e) => console.error("[terminal] worker error:", e);

        worker.postMessage({ type: "terminal:connect" });

        let input = "";
        term.onKey(({ key, domEvent }) => {
            if (domEvent.key === "Enter") {
                term.write("\r\n");
                worker.postMessage({ type: "input", data: input });
                input = "";
            } else if (domEvent.key === "Backspace") {
                if (input.length > 0) { input = input.slice(0, -1); term.write("\b \b"); }
            } else if (key.length === 1) {
                input += key; term.write(key);
            }
        });

        const observer = new ResizeObserver(() => fit.fit());
        if (termRef.current) observer.observe(termRef.current);

        return () => {
            observer.disconnect();
            term.dispose();
        };
    }, []);

    return <div ref={termRef} style={{ width: "100%", height: "100%" }} />;
});

export default Terminal;