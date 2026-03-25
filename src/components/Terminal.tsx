import { Terminal as Term } from "@xterm/xterm";
import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import "@xterm/xterm/css/xterm.css";
import { FitAddon } from "@xterm/addon-fit";

declare global {
    interface Window {
        Module: any;
        __requestLine: ((line: string) => void) | null;
    }
}

const Terminal = forwardRef((props, ref) => {
    const termRef = useRef<HTMLDivElement>(null);
    const termInstance  = useRef<Term | null>(null);

    useEffect(() => {
        const term = new Term({
            theme: {
                background: "#000000",
                foreground: "#80dbff",
            },
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

        window.__requestLine = null;

        let input = "";

        term.onKey(({ key, domEvent }) => {
            if (domEvent.key === "Enter") {
                term.write("\r\n");
                if (window.__requestLine) {
                    const resolve = window.__requestLine;
                    window.__requestLine = null;
                    resolve(input);
                }
                input = "";
            } else if (domEvent.key === "Backspace") {
                if (input.length > 0) {
                    input = input.slice(0, -1);
                    term.write("\b \b");
                }
            } else if (key.length === 1) {
                input += key;
                term.write(key);
            }
        });

        window.Module = {
            print: (text: string) => {
                term.write(text + "\r\n");
            },
            printErr: (text: string) => {
                if (text.includes("stdio streams")) return;
                term.write("\x1b[31m" + text + "\x1b[0m\r\n");
            },
            onRuntimeInitialized: () => {
                (window as any).__printPrompt = (cwd: string) => {
                    term.write("\x1b[0m" + cwd + "\x1b[37m > ");
                };
            }
        };

        if (!document.querySelector('script[src="/lite.js"]')) {
            const script = document.createElement("script");
            script.src = "/lite.js";
            document.body.appendChild(script);
        }

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