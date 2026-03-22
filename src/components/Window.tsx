import { useRef, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import "./Window.css";

interface WindowProps {
    title: string;
    children: ReactNode;
    initialX?: number;
    initialY?: number;
    width?: number;
    height?: number;
    onClose?: () => void;
    onFocus?: () => void;
    zIndex?: number;
}

export default function Window({
    title,
    children,
    initialX = 150,
    initialY = 80,
    width = 720,
    height = 480,
    onClose,
    onFocus,
    zIndex = 1,
}: WindowProps) {
    const [pos, setPos] = useState({ x: initialX, y: initialY });
    const [size, setSize] = useState({w: width, h: height});
    const dragging = useRef(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    const onMouseDown = useCallback(
        (e: React.MouseEvent) => {
            dragging.current = true;
            dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
            onFocus?.();
            e.preventDefault();
        },
        [pos, onFocus]
    );

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (!dragging.current) return;
            setPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
            if (isMaximized.current) {
                setSize({ w: width, h: height });
                isMaximized.current = false;
            }
        };
        const onMouseUp = () => { dragging.current = false; };

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
            setSize({ w: width, h: height });
            setPos({ x: prevPos.current.x, y: prevPos.current.y });
            isMaximized.current = false;
        } else {
            prevPos.current = { x: pos.x, y: pos.y };
            setSize({ w: window.innerWidth, h: window.innerHeight });
            setPos({ x: 0, y: 0 });
            isMaximized.current = true;
        }
    };

    return (
        <div
            className="window"
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
                    />
                    <button
                        className="win-btn maximize"
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            // setMinimized(m => !m);
                            // setSize({w: 1920, h: 1080});
                            maximize();
                        }}
                        title="Maximize"
                    />
                </div>
                <span className="window-title">{title}</span>
            </div>

            {/* Content */}
                <div className="window-content" style={{ height: size.h }}>
                    {children}
                </div>
            
            {/* edges */}
            <div style={{ position: "absolute", top: 0, left: 4, right: 4, height: 4, cursor: "n-resize" }} />
            <div style={{ position: "absolute", bottom: 0, left: 4, right: 4, height: 4, cursor: "s-resize" }} />
            <div style={{ position: "absolute", left: 0, top: 4, bottom: 4, width: 4, cursor: "w-resize" }} />
            <div style={{ position: "absolute", right: 0, top: 4, bottom: 4, width: 4, cursor: "e-resize" }} />

            {/* corners */}
            <div style={{ position: "absolute", top: 0, left: 0, width: 8, height: 8, cursor: "nw-resize" }} />
            <div style={{ position: "absolute", top: 0, right: 0, width: 8, height: 8, cursor: "ne-resize" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, width: 8, height: 8, cursor: "sw-resize" }} />
            <div style={{ position: "absolute", bottom: 0, right: 0, width: 8, height: 8, cursor: "se-resize" }} />
        </div>
    );
}