import { Terminal as Term } from "@xterm/xterm";
import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import "@xterm/xterm/css/xterm.css";
import { FitAddon } from "@xterm/addon-fit";

declare global {
    interface Window {
        Module: any;
        __requestLine: ((line: string) => void) | null;
        __openEditor: ((filename: string, content: string, onSave: (content: string) => void) => void) | null;
        __printPrompt: ((cwd: string) => void) | null;
    }
}

const Terminal = forwardRef((props, ref) => {
    const termRef = useRef<HTMLDivElement>(null);
    const termInstance = useRef<Term | null>(null);

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

        // --- Editor state ---
        let editorActive = false;
        let editorLines: string[] = [];
        let editorCursor = { row: 0, col: 0 };
        let editorFilename = "";
        let editorOnSave: ((content: string) => void) | null = null;
        // Track terminal dimensions for rendering
        let editorScrollOffset = 0; // top visible line index

        const HEADER_ROWS = 2; // status bar + divider

        function editorViewRows() {
            return term.rows - HEADER_ROWS - 1; // -1 for bottom status bar
        }

        function editorRender() {
            const viewRows = editorViewRows();
            term.write("\x1b[2J\x1b[H"); // clear screen, cursor to top

            // Header bar
            term.write(`\x1b[48;5;24m\x1b[97m LITE EDITOR — ${editorFilename} \x1b[0m`);
            term.write(`\x1b[48;5;24m\x1b[97m  ^S Save & Exit  ^Q Discard  ^X Cut Line  ^K Del to EOL \x1b[0m\r\n`);
            term.write("\x1b[90m" + "─".repeat(term.cols) + "\x1b[0m\r\n");

            // Adjust scroll so cursor is visible
            if (editorCursor.row < editorScrollOffset) {
                editorScrollOffset = editorCursor.row;
            } else if (editorCursor.row >= editorScrollOffset + viewRows) {
                editorScrollOffset = editorCursor.row - viewRows + 1;
            }

            // Render visible lines
            for (let i = 0; i < viewRows; i++) {
                const lineIdx = editorScrollOffset + i;
                const lineNum = String(lineIdx + 1).padStart(4, " ");
                if (lineIdx < editorLines.length) {
                    const line = editorLines[lineIdx];
                    const display = line.length > term.cols - 7
                        ? line.slice(0, term.cols - 7)
                        : line;
                    term.write(`\x1b[90m${lineNum} \x1b[0m${display}`);
                } else {
                    term.write(`\x1b[90m${lineNum} ~\x1b[0m`);
                }
                term.write("\r\n");
            }

            // Bottom status bar
            const status = ` Ln ${editorCursor.row + 1}, Col ${editorCursor.col + 1}  |  ${editorLines.length} lines`;
            term.write(`\x1b[48;5;236m\x1b[37m${status}\x1b[0m`);

            // Position the actual cursor
            const screenRow = HEADER_ROWS + (editorCursor.row - editorScrollOffset) + 1;
            const screenCol = 6 + editorCursor.col + 1; // 6 = line number gutter width
            term.write(`\x1b[${screenRow};${screenCol}H`);
        }

        function editorHandleKey(key: string, domEvent: KeyboardEvent) {
            const { row, col } = editorCursor;
            const line = editorLines[row] ?? "";

            if (domEvent.ctrlKey) {
                switch (domEvent.key) {
                    case "s": // Save
                        editorActive = false;
                        const saved = editorLines.join("\n");
                        editorOnSave?.(saved);
                        editorOnSave = null;
                        term.write("\x1b[2J\x1b[H");
                        return;
                    case "q": // Discard
                        editorActive = false;
                        editorOnSave?.("");  // empty string = discard signal (C side handles it)
                        editorOnSave = null;
                        term.write("\x1b[2J\x1b[H");
                        return;
                    case "x": // Cut line
                        editorLines.splice(row, 1);
                        if (editorLines.length === 0) editorLines = [""];
                        editorCursor.row = Math.min(row, editorLines.length - 1);
                        editorCursor.col = 0;
                        editorRender();
                        return;
                    case "k": // Delete to end of line
                        editorLines[row] = line.slice(0, col);
                        editorRender();
                        return;
                }
            }

            switch (domEvent.key) {
                case "ArrowUp":
                    if (row > 0) {
                        editorCursor.row--;
                        editorCursor.col = Math.min(col, editorLines[editorCursor.row].length);
                    }
                    break;
                case "ArrowDown":
                    if (row < editorLines.length - 1) {
                        editorCursor.row++;
                        editorCursor.col = Math.min(col, editorLines[editorCursor.row].length);
                    }
                    break;
                case "ArrowLeft":
                    if (col > 0) {
                        editorCursor.col--;
                    } else if (row > 0) {
                        editorCursor.row--;
                        editorCursor.col = editorLines[editorCursor.row].length;
                    }
                    break;
                case "ArrowRight":
                    if (col < line.length) {
                        editorCursor.col++;
                    } else if (row < editorLines.length - 1) {
                        editorCursor.row++;
                        editorCursor.col = 0;
                    }
                    break;
                case "Home":
                    editorCursor.col = 0;
                    break;
                case "End":
                    editorCursor.col = line.length;
                    break;
                case "PageUp":
                    editorCursor.row = Math.max(0, row - editorViewRows());
                    editorCursor.col = Math.min(col, editorLines[editorCursor.row].length);
                    break;
                case "PageDown":
                    editorCursor.row = Math.min(editorLines.length - 1, row + editorViewRows());
                    editorCursor.col = Math.min(col, editorLines[editorCursor.row].length);
                    break;
                case "Enter":
                    const before = line.slice(0, col);
                    const after = line.slice(col);
                    editorLines[row] = before;
                    editorLines.splice(row + 1, 0, after);
                    editorCursor.row++;
                    editorCursor.col = 0;
                    break;
                case "Backspace":
                    if (col > 0) {
                        editorLines[row] = line.slice(0, col - 1) + line.slice(col);
                        editorCursor.col--;
                    } else if (row > 0) {
                        const prevLine = editorLines[row - 1];
                        editorCursor.col = prevLine.length;
                        editorLines[row - 1] = prevLine + line;
                        editorLines.splice(row, 1);
                        editorCursor.row--;
                    }
                    break;
                case "Delete":
                    if (col < line.length) {
                        editorLines[row] = line.slice(0, col) + line.slice(col + 1);
                    } else if (row < editorLines.length - 1) {
                        editorLines[row] = line + editorLines[row + 1];
                        editorLines.splice(row + 1, 1);
                    }
                    break;
                case "Tab":
                    editorLines[row] = line.slice(0, col) + "    " + line.slice(col);
                    editorCursor.col += 4;
                    break;
                default:
                    if (key.length === 1) {
                        editorLines[row] = line.slice(0, col) + key + line.slice(col);
                        editorCursor.col++;
                    }
                    return; // don't re-render for unhandled keys
            }

            editorRender();
        }

        // Expose editor opener to C via JS bridge
        window.__openEditor = (filename, content, onSave) => {
            editorActive = true;
            editorFilename = filename;
            editorLines = content.length > 0 ? content.split("\n") : [""];
            editorCursor = { row: 0, col: 0 };
            editorScrollOffset = 0;
            editorOnSave = onSave;
            editorRender();
        };

        let input = "";

        term.onKey(({ key, domEvent }) => {
            // Route all keys to editor when active
            if (editorActive) {
                editorHandleKey(key, domEvent);
                return;
            }

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
                window.__printPrompt = (cwd: string) => {
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