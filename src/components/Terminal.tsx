import { Terminal as Term } from "@xterm/xterm";
import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import "@xterm/xterm/css/xterm.css";
import { FitAddon } from "@xterm/addon-fit";
import { useWorker } from "./WorkerContext";

const Terminal = forwardRef((_, ref) => {
    const termRef = useRef<HTMLDivElement>(null);
    const termInstance = useRef<Term | null>(null);
    const worker = useWorker();

    useEffect(() => {
        const term = new Term({
            theme: { background: "#000000", foreground: "#80dbff" },
            fontFamily: "'Share Tech Mono', 'Courier New', monospace",
            fontSize: 14,
            lineHeight: 1.4,
            cursorBlink: true,
        });

        termInstance.current = term;

        const fit = new FitAddon();
        term.loadAddon(fit);
        term.open(termRef.current!);
        fit.fit();

        worker.onmessage = (e) => {
            const { type, data } = e.data;
            if (type === "print") term.write(data + "\r\n");
            else if (type === "printErr") term.write("\x1b[31m" + data + "\x1b[0m\r\n");
            else if (type === "prompt") term.write("\x1b[0m" + data + "\x1b[37m > ");
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

    useImperativeHandle(ref, () => ({
        clear: () => termInstance.current?.clear()
    }));

    return <div ref={termRef} style={{ width: "100%", height: "100%" }} />;
});

export default Terminal;