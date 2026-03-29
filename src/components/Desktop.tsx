import { useRef, useState, useEffect, useCallback } from "react";
import Window from "./Window";
import Terminal from "./Terminal";
import "./css/Desktop.css";
import App from "./App";
import Taskbar from "./Taskbar";
import PDFViewer from "./PDFViewer";
import WebViewer from "./WebViewer";
import FileExplorer from "./FileExplorer";
import { useWorker } from "./em/WorkerContext";
import { workerFS, onFSReady } from "./em/workerFS";
// import ParticleBackground, { type ParticleBackgroundHandle } from "./ParticleBackground";

import terminalIcon from "../assets/terminal.png";
import pdfIcon from "../assets/pdf.png";
import reactLogo from "../assets/react.svg";
import resume from "../assets/resume.pdf";
import explorer from "../assets/explorer.png"
import kotonohanoniwa from "../assets/kotonohanoniwa.mp4";

export interface AppState {
    id: number;
    name: string;
    icon: string;
    selected: boolean;
    pos: { x: number; y: number };
    dimensions: { w: number; h: number };
}

export interface WindowState {
    id: number;
    appId: number;
    zIndex: number;
    hidden: boolean;
}

const CELL_W = 80;
const CELL_H = 100;

let windowId = 1;
let topZ = 10;
let appId = 1;

const initialApps: AppState[] = [
    { id: appId++, name: "File Explorer",icon: explorer, selected: false, pos: { x: 0 * CELL_W, y: 0 * CELL_H }, dimensions: { w: 55, h: 55 } },
    { id: appId++, name: "Terminal", icon: terminalIcon, selected: false, pos: { x: 0 * CELL_W, y: 1 * CELL_H }, dimensions: { w: 55, h: 55 } },
    { id: appId++, name: "Resume",   icon: pdfIcon,      selected: false, pos: { x: 0 * CELL_W, y: 2 * CELL_H }, dimensions: { w: 55, h: 55 } },
    { id: appId++, name: "Portfolio",icon: reactLogo,    selected: false, pos: { x: 0 * CELL_W, y: 3 * CELL_H }, dimensions: { w: 55, h: 55 } },
];

export default function Desktop() {
    // FILE SYSTEM
    const worker = useWorker();
    const fs = workerFS(worker);
    useEffect(() => {
        onFSReady(worker, async () => {
            try {
                await fs.mkdir('/home/web_user/desktop');
                await fs.mkdir('/home/web_user/downloads');
                await fs.mkdir('/home/web_user/documents');
                await fs.mkdir('/home/web_user/pictures');
                await fs.mkdir('/home/web_user/videos');
                await fs.mkdir('/home/web_user/music');
            } catch(e) {
                console.error("[desktop] mkdir failed", e);
            }
            for (const app of initialApps) {
                try {
                    const content = JSON.stringify(app) + "\n";
                    await fs.writeFile(`/home/web_user/desktop/${app.name}`, content);
                } catch(e) {
                    console.error("[desktop] writeFile failed", app.name, e);
                }
            }
            worker.postMessage({ type: "fs:initialized" });
        });
    }, []);

    // const particleRef = useRef<ParticleBackgroundHandle>(null);

    const [apps, setApps] = useState<AppState[]>(initialApps);
    const [windows, setWindows] = useState<WindowState[]>([]);

    const terminalRef = useRef<{ clear: () => void }>(null);

    // DESKTOP GRID
    const desktopRef = useRef<HTMLDivElement>(null);
    const gridCols = useRef(0);
    const gridRows = useRef(0);

    useEffect(() => {
        const observer = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;
            gridCols.current = Math.floor(width  / CELL_W);
            gridRows.current = Math.floor(height / CELL_H);
        });

        if (desktopRef.current) observer.observe(desktopRef.current);
        return () => observer.disconnect();
    }, []);

    // WINDOW HELPERS
    const focusWindow = useCallback((id: number) => {
        topZ++;
        setWindows(ws => ws.map(w => w.id === id ? { ...w, zIndex: topZ } : w));
    }, []);

    const toggleWindow = useCallback((id: number) => {
        topZ++;
        setWindows(ws => ws.map(w => w.id === id ? { ...w, hidden: !w.hidden, zIndex: topZ } : w));
    }, []);

    const closeWindow = useCallback((id: number) => {
        setWindows(ws => {
            const win = ws.find(w => w.id === id);
            if (!win) return ws;
            return ws.filter(w => w.id !== id);
        });
    }, []);

    // APP MANAGEMENT
    const onAppClick = useCallback((id: number) => {
        if (didDrag.current) return;
        setApps(prev => prev.map(a => ({ ...a, selected: a.id === id })));
    }, []);

    const onAppDoubleClick = useCallback((id: number) => {
        const app = apps.find(a => a.id === id);
        if (!app) return;
        topZ++;
        setWindows(prev => [...prev, { id: windowId++, appId: app.id, zIndex: topZ, hidden: false }]);
    }, [apps, windows]);

    // MOUSE STUFF
    const dragging = useRef(false);
    const draggingApp = useRef(false);
    const startPos = useRef({ x: 0, y: 0 });
    const currPos  = useRef({ x: 0, y: 0 });
    const lastPos = useRef({ x: 0, y: 0 });
    const didDrag = useRef(false);
    const dragStartPositions = useRef<Map<number, {x: number, y: number, offsetX: number, offsetY: number}>>(new Map());
    // const appPos = useRef({x: 0, y: 0})
    const [, forceUpdate] = useState(0);

    const onMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.target !== e.currentTarget) return;
        dragging.current = true;
        startPos.current = { x: e.clientX, y: e.clientY };
        currPos.current  = { x: e.clientX, y: e.clientY };
        setApps(prev => prev.map(a => ({ ...a, selected: false })));
        e.preventDefault();

        // particleRef.current?.addParticle(e.clientX, e.clientY);
    }, []);

    const onAppMouseDown = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        dragging.current = true;
        draggingApp.current = true;
        lastPos.current  = { x: e.clientX, y: e.clientY };
        
        setApps(prev => {
            const clickedApp = prev.find(a => a.id === id);
            const wasSelected = clickedApp?.selected ?? false;

            return prev.map(a => {
                if (!wasSelected) {
                    if (a.id === id) {
                        dragStartPositions.current.set(a.id, {
                            x: a.pos.x,
                            y: a.pos.y,
                            offsetX: a.pos.x - e.clientX,
                            offsetY: a.pos.y - e.clientY,
                        });
                        return { ...a, selected: true };
                    }
                    return { ...a, selected: false };
                } else {
                    if (a.selected) {
                        dragStartPositions.current.set(a.id, {
                            x: a.pos.x,
                            y: a.pos.y,
                            offsetX: a.pos.x - e.clientX,
                            offsetY: a.pos.y - e.clientY,
                        });
                    }
                    return a;
                }
            });
        });
    };

    useEffect(() => {
        const snapToGrid = () => {
            setApps(prev => {
                const occupied = new Set<string>();
                prev.forEach(a => {
                    if (!a.selected) {
                        const col = Math.floor(a.pos.x / CELL_W);
                        const row = Math.floor(a.pos.y / CELL_H);
                        occupied.add(`${col},${row}`);
                    }
                });

                const selectedApps = prev.filter(a => a.selected);
                const isSingle = selectedApps.length === 1;

                return prev.map(a => {
                    if (!a.selected) return a;

                    const origin = dragStartPositions.current.get(a.id);
                    if (!origin) return a;

                    let targetX, targetY;
                    if (isSingle) {
                        targetX = lastPos.current.x;
                        targetY = lastPos.current.y;
                    } else {
                        targetX = lastPos.current.x + origin.offsetX;
                        targetY = lastPos.current.y + origin.offsetY;
                    }

                    let col = Math.floor(targetX / CELL_W);
                    let row = Math.floor(targetY / CELL_H);
                    col = Math.max(0, Math.min(col, gridCols.current - 1));
                    row = Math.max(0, Math.min(row, gridRows.current - 1));

                    if (!occupied.has(`${col},${row}`)) {
                        occupied.add(`${col},${row}`);
                        return { ...a, pos: { x: col * CELL_W, y: row * CELL_H } };
                    }

                    const origCol = Math.floor(origin.x / CELL_W);
                    const origRow = Math.floor(origin.y / CELL_H);
                    occupied.add(`${origCol},${origRow}`);
                    return { ...a, pos: { x: origCol * CELL_W, y: origRow * CELL_H } };
                });
            });
        };

        const onMouseMove = (e: MouseEvent) => {
            if (!dragging.current) return;
            currPos.current = { x: e.clientX, y: e.clientY };

             if (draggingApp.current) {
                const dx = currPos.current.x - lastPos.current.x;
                const dy = currPos.current.y - lastPos.current.y;
                lastPos.current = { x: currPos.current.x, y: currPos.current.y };
                if (dx !== 0 || dy !== 0) didDrag.current = true;
                setApps(prev => prev.map(a => {
                    if (!a.selected) return a;
                    return { ...a, pos: { x: a.pos.x + dx, y: a.pos.y + dy } };
                }));
            } else {
                const width  = Math.abs(currPos.current.x - startPos.current.x);
                const height = Math.abs(currPos.current.y - startPos.current.y);

                if (width > 5 && height > 5) {
                    const left = Math.min(startPos.current.x, currPos.current.x);
                    const top  = Math.min(startPos.current.y, currPos.current.y);
                    setApps(prev => prev.map(a => ({
                        ...a,
                        selected:
                            a.pos.x + a.dimensions.w >= left &&
                            a.pos.x <= left + width &&
                            a.pos.y + a.dimensions.h >= top &&
                            a.pos.y <= top + height,
                    })));
                }
            }

            forceUpdate(n => n + 1);
        };

        const onMouseUp = () => {
            if (!dragging.current) return;

            if (draggingApp.current) {
                snapToGrid();
            }

            dragging.current = false;
            draggingApp.current = false;

            currPos.current  = { x: 0, y: 0 };
            startPos.current = { x: 0, y: 0 };

            forceUpdate(n => n + 1);
            setTimeout(() => { didDrag.current = false; }, 0);
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup",   onMouseUp);
        return () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup",   onMouseUp);
        };
    }, []);

    const selection = () => {
        if (!dragging.current || draggingApp.current) return null;
        const left   = Math.min(startPos.current.x, currPos.current.x);
        const top    = Math.min(startPos.current.y, currPos.current.y);
        const width  = Math.abs(currPos.current.x - startPos.current.x);
        const height = Math.abs(currPos.current.y - startPos.current.y);
        if (width < 2 && height < 2) return null;
        return (
            <div style={{
                position: "absolute", left, top, width, height,
                background: "#ffffff2f",
                outline: "1px solid #ffffff89",
                pointerEvents: "none",
            }} />
        );
    };


    return (
        <div>
            <div className="desktop" onMouseDown={onMouseDown} ref={desktopRef}>
                {/* <ParticleBackground ref={particleRef} /> */}

                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{
                        position: "absolute",
                        top: 0, left: 0,
                        width: "100%", height: "100%",
                        objectFit: "cover",
                        zIndex: 0,
                        pointerEvents: "none",
                    }}
                >
                    <source src={kotonohanoniwa} type="video/mp4" />
                </video>

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
                        onMouseDown={(e) => onAppMouseDown(e, a.id)}
                    />
                ))}

                {windows.map(w => {
                    const app = apps.find(a => a.id === w.appId);
                    if (!app) return null;
                    return (
                        <div key={w.id} style={{ display: w.hidden ? "none" : "block" }}>
                            <Window
                                title={app.name}
                                zIndex={w.zIndex}
                                onFocus={() => focusWindow(w.id)}
                                onMinimize={() => toggleWindow(w.id)}
                                onClose={() => closeWindow(w.id)}
                            >
                                {app.name === "Terminal" && <Terminal ref={terminalRef} />}
                                {app.name === "Resume"   && <PDFViewer file={resume} />}
                                {app.name === "Portfolio"   && <WebViewer url="https://andypham.cc/" />}
                                {app.name === "File Explorer"   && <FileExplorer />}
                            </Window>
                        </div>
                    );
                })}


                {selection()}
            </div>

            <Taskbar windows={windows} apps={apps} onToggleWindow={toggleWindow} onFocusWindow={focusWindow} />
        </div>
    );
}