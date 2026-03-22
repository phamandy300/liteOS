import { useRef, useState, useEffect, useCallback } from "react";
import Window from "./Window";
import Terminal from "./Terminal";
import "./Desktop.css";
import App from "./App";
import Taskbar from "./Taskbar";
import PDFViewer from "./PDFViewer";

import terminalIcon from "../assets/terminal.png";
import pdfIcon from "../assets/pdf.png";
import reactLogo from "../assets/react.svg";
import resume from "../assets/resume.pdf";


interface WindowState {
    id: number;
    title: string;
    zIndex: number;
    hidden?: boolean;
    type: "terminal" | "pdf";
    data?: any;
}

interface AppState {
    id: number;
    name: string;
    icon: string;
    selected: boolean;
    pos: { x: number; y: number };
    dimensions: { w: number; h: number };
}

let windowId = 1;
let topZ = 10;
let appId = 1;

export default function Desktop() {
    // WINDOW MANAGEMENT
    const [windows, setWindows] = useState<WindowState[]>([
        { id: windowId++, title: "terminal", zIndex: topZ, type: "terminal", hidden: true},
    ]);

    const focusWindow = useCallback((id: number) => {
        topZ++;
        setWindows(ws => ws.map(w => w.id === id ? { ...w, zIndex: topZ } : w));
    }, []);

    // TERMINAL WINDOW
    const terminalRef = useRef<{ clear: () => void }>(null);

    const closeWindow = useCallback((id: number) => {
        const termWindow = windows.find(w => w.title === "terminal");
        if (termWindow && id === termWindow.id) {
            terminalRef.current?.clear();
            setWindows(ws => ws.map(w => w.id === id ? { ...w, hidden: true } : w));
        } else {
            setWindows(ws => ws.filter(w => w.id !== id));
        }
    }, [windows]);


    // APP MANAGEMENT
    const [apps, setApps] = useState<AppState[]>([
        { id: appId++, name: "Terminal", icon: terminalIcon, selected: false, pos: { x: 10, y: 20 }, dimensions: { w: 55, h: 55 } },
        { id: appId++, name: "Resume", icon: pdfIcon, selected: false, pos: { x: 10, y: 120 }, dimensions: { w: 55, h: 55 } },
        { id: appId++, name: "Andy Pham", icon: reactLogo, selected: false, pos: { x: 10, y: 220 }, dimensions: { w: 55, h: 55 } },
    ]);

    const onAppClick = useCallback((id: number) => {
        setApps(prev => prev.map(a => ({ ...a, selected: a.id === id })));
    }, []);

    const onAppDoubleClick = useCallback((id: number) => {
        const app = apps.find(a => a.id === id);
        if (!app) return;

        if (app.name === "Terminal") {
            const existing = windows.find(w => w.type === "terminal");
            if (existing) {
                topZ++;
                setWindows(ws => ws.map(w => w.id === existing.id ? { ...w, hidden: false, zIndex: topZ } : w));
                return;
            }
            topZ++;
            setWindows(prev => [...prev, { id: windowId++, title: "terminal", zIndex: topZ, type: "terminal", hidden: false }]);
        }

        if (app.name === "Resume") {
            topZ++;
            setWindows(prev => [...prev, { id: windowId++, title: "Resume", zIndex: topZ, type: "pdf", hidden: false}]);
        }
    }, [windows, apps]);

    // SELECTION BOX
    const dragging = useRef(false);
    const startPos = useRef({ x: 0, y: 0 });
    const currPos = useRef({ x: 0, y: 0 });
    const [, forceUpdate] = useState(0);

    const onMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.target !== e.currentTarget) return;
        dragging.current = true;
        startPos.current = { x: e.clientX, y: e.clientY };
        currPos.current = { x: e.clientX, y: e.clientY };
        setApps(prev => prev.map(a => ({ ...a, selected: false })));
        e.preventDefault();
    }, []);

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (!dragging.current) return;
            currPos.current = { x: e.clientX, y: e.clientY };
            forceUpdate(n => n + 1);
        };

        const onMouseUp = () => {
            if (!dragging.current) return;
            dragging.current = false;

            const width = Math.abs(currPos.current.x - startPos.current.x);
            const height = Math.abs(currPos.current.y - startPos.current.y);

            if (width > 5 && height > 5) {
                const left = Math.min(startPos.current.x, currPos.current.x);
                const top = Math.min(startPos.current.y, currPos.current.y);

                setApps(prev => prev.map(a => ({
                    ...a,
                    selected:
                        a.pos.x + a.dimensions.w >= left &&
                        a.pos.x <= left + width &&
                        a.pos.y + a.dimensions.h >= top &&
                        a.pos.y <= top + height
                })));
            }

            currPos.current = { x: 0, y: 0 };
            startPos.current = { x: 0, y: 0 };
            forceUpdate(n => n + 1);
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
        return () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };
    }, []);

    const selection = () => {
        if (!dragging.current) return null;
        const left = Math.min(startPos.current.x, currPos.current.x);
        const top = Math.min(startPos.current.y, currPos.current.y);
        const width = Math.abs(currPos.current.x - startPos.current.x);
        const height = Math.abs(currPos.current.y - startPos.current.y);
        if (width < 2 && height < 2) return null;

        return (
            <div style={{
                position: "absolute",
                left, top, width, height,
                background: "#008cff61",
                outline: "1px solid #008cff",
                pointerEvents: "none"
            }} />
        );
    };

    return (
        <div className="desktop" onMouseDown={onMouseDown}>
            {apps.map(a => (
                <App
                    key={a.id}
                    name={a.name}
                    icon={a.icon}
                    selected={a.selected}
                    x={a.pos.x}
                    y={a.pos.y}
                    w={a.dimensions.w}
                    h={a.dimensions.h}
                    onClick={() => onAppClick(a.id)}
                    onDoubleClick={() => onAppDoubleClick(a.id)}
                />
            ))}

            {windows.map(w => (
                <div key={w.id} style={{ display: w.hidden ? "none" : "block" }}>
                    <Window
                        title={w.title}
                        zIndex={w.zIndex}
                        onFocus={() => focusWindow(w.id)}
                        onClose={() => closeWindow(w.id)}
                    >
                        {w.type === "terminal" && <Terminal ref={terminalRef} />}
                        {w.type === "pdf" && <PDFViewer file={resume}/>}
                    </Window>
                </div>
            ))}

            <Taskbar></Taskbar>

            {selection()}
        </div>
    );
}