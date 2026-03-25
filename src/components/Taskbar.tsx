import "./Taskbar.css";
import { useState, useEffect } from "react";
import type { AppState, WindowState } from "./Desktop";

import sun from "/sun1.png";

interface TaskbarProps {
    windows: WindowState[];
    apps: AppState[];
    onToggleWindow: (id: number) => void;
    onFocusWindow: (id: number) => void;
}

export default function Taskbar({ windows, apps, onToggleWindow, onFocusWindow }: TaskbarProps) {
    const [now, setNow] = useState(() =>
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    );

    useEffect(() => {
        const interval = setInterval(() => {
            setNow(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        }, 100);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="taskbar">
            <div className="taskbar-left">
                <div className="start-button">
                    <img src={sun} width={28} />
                </div>

                {windows.map(w => {
                    const app = apps.find(a => a.id === w.appId);
                    if (!app) return null;

                    const isTop = !w.hidden && w.zIndex === Math.max(...windows.filter(w => !w.hidden).map(w => w.zIndex));

                    const stateClass = w.hidden ? "minimized" : isTop ? "active" : "inactive";
                    
                    return (
                        <div
                            key={w.id}
                            className={`taskbar-app ${stateClass}`}
                            onClick={() => {
                                if (isTop || w.hidden) onToggleWindow(w.id);
                                else onFocusWindow(w.id);
                            }}
                        >
                            <img src={app.icon} width={14} height={14} />
                            {app.name}
                        </div>
                    );
                })}
            </div>

            <div className="taskbar-right">
                {now}
            </div>
        </div>
    );
}