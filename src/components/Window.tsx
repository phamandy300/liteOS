import { useRef, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import "./css/Window.css";

interface WindowProps {
    title: string;
    children: ReactNode;
    initialX?: number;
    initialY?: number;
    width?: number;
    height?: number;
    taskbarH?: number
    onClose?: () => void;
    onMinimize?: () => void;
    onFocus?: () => void;
    zIndex?: number;
}

const MIN_W = 200;
const MIN_H = 120;

export default function Window({
    title,
    children,
    initialX = 150,
    initialY = 80,
    width = 720,
    height = 480,
    onClose,
    onMinimize,
    onFocus,
    zIndex = 1,
}: WindowProps) {
    const [pos, setPos] = useState({ x: initialX, y: initialY });
    const [size, setSize] = useState({w: width, h: height});
    const prevSize = useRef({ w: width, h: height });
    const dragging = useRef(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    
    const resizingDir = useRef("");
    const resizing = useRef(false);
    const downPos = useRef({ x: 0, y: 0 });

    const onMouseDown = useCallback(
        (e: React.MouseEvent) => {
            dragging.current = true;
            dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
            onFocus?.();
            e.preventDefault();
        },
        [pos, onFocus]
    );

    const onResizeMouseDown = (dir: string) => (e: React.MouseEvent) => {
        onFocus?.();
        resizingDir.current = dir;
        resizing.current = true;
        downPos.current = { x: e.clientX, y: e.clientY };
        e.preventDefault();
        e.stopPropagation();
    };

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (dragging.current) {
                setPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
                if (isMaximized.current) {
                    setSize({ w: prevSize.current.w, h: prevSize.current.h });
                    isMaximized.current = false;
                }
            }
            

            else if (resizing.current) {
                const dx = e.clientX - downPos.current.x;
                const dy = e.clientY - downPos.current.y;
                downPos.current = { x: e.clientX, y: e.clientY };

                const dir = resizingDir.current;

                setSize(prev => {
                    const newW = Math.max(MIN_W, prev.w + (dir.includes("e") ? dx : dir.includes("w") ? -dx : 0));
                    const newH = Math.max(MIN_H, prev.h + (dir.includes("s") ? dy : dir.includes("n") ? -dy : 0));
                    prevSize.current = { w: newW, h: newH };
                    return { w: newW, h: newH };
                });

                setPos(prev => ({
                    x: prev.x + (dir.includes("w") ? dx : 0),
                    y: prev.y + (dir.includes("n") ? dy : 0),
                }));


            }
            
        };

        const onMouseUp = () => { dragging.current = false; resizing.current = false };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
        return () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };
    }, []);
    
    const isMaximized = useRef(false);
    const prevPos = useRef({ x: 0, y: 0 });

    const maximize = () => {
        if (isMaximized.current) {
            setSize({ w: prevSize.current.w, h: prevSize.current.h });
            setPos({ x: prevPos.current.x, y: prevPos.current.y });
            isMaximized.current = false;
        } else {
            prevPos.current = { x: pos.x, y: pos.y };
            setSize({ 
                w: window.innerWidth, 
                h: window.innerHeight - 70
            });
            setPos({ x: 0, y: 0 });
            isMaximized.current = true;
        }
    };

    return (
        <div
            className={`window${isMaximized.current ? " max" : ""}`}
            style={{ left: pos.x, top: pos.y, width: size.w, zIndex }}
            onMouseDown={onFocus}
        >
            {/* Title bar */}
            <div className="window-titlebar" onMouseDown={onMouseDown}>
                <div className="window-controls">
                    <button
                        className="win-btn close"
                        onClick={(e) => { 
                            e.stopPropagation(); onClose?.(); 
                            setPos({ x: initialX, y: initialY });
                        }}
                        title="Close"
                    >
                        <div className="win-btn-icon" style={{ maskImage: "url('/close.png')", WebkitMaskImage: "url('/close.png')" }} />
                    </button>
                    <button
                        className="win-btn minimize"
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            onMinimize?.();
                        }}
                        title="Minimize"
                    >
                        <div className="win-btn-icon" style={{ maskImage: "url('/chevron_down.png')", WebkitMaskImage: "url('/chevron_down.png')" }} />
                    </button>
                    <button
                        className="win-btn maximize"
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            maximize();
                        }}
                        title="Maximize"
                    >
                        <div className="win-btn-icon" style={{ maskImage: "url('/chevron_up.png')", WebkitMaskImage: "url('/chevron_up.png')" }} />
                    </button>
                </div>
                <span className="window-title">{title}</span>
            </div>

            {/* Content */}
            <div className={title === "Terminal" ? "window-content-terminal" : "window-content"} style={{ height: size.h }}>
                {children}
            </div>
            
            {/* edges */}
            <div style={{ position: "absolute", top: 0, left: 4, right: 4, height: 4, cursor: "n-resize" }} onMouseDown={onResizeMouseDown("n")} />
            <div style={{ position: "absolute", bottom: 0, left: 4, right: 4, height: 4, cursor: "s-resize" }} onMouseDown={onResizeMouseDown("s")} />
            <div style={{ position: "absolute", left: 0, top: 4, bottom: 4, width: 4, cursor: "w-resize" }} onMouseDown={onResizeMouseDown("w")} />
            <div style={{ position: "absolute", right: 0, top: 4, bottom: 4, width: 4, cursor: "e-resize" }} onMouseDown={onResizeMouseDown("e")} />

            {/* corners */}
            <div style={{ position: "absolute", top: 0, left: 0, width: 8, height: 8, cursor: "nw-resize" }} onMouseDown={onResizeMouseDown("nw")} />
            <div style={{ position: "absolute", top: 0, right: 0, width: 8, height: 8, cursor: "ne-resize" }} onMouseDown={onResizeMouseDown("ne")} />
            <div style={{ position: "absolute", bottom: 0, left: 0, width: 8, height: 8, cursor: "sw-resize" }} onMouseDown={onResizeMouseDown("sw")} />
            <div style={{ position: "absolute", bottom: 0, right: 0, width: 8, height: 8, cursor: "se-resize" }} onMouseDown={onResizeMouseDown("se")} />
        </div>
    );
}