import "./Taskbar.css";
import { useRef, useState, useEffect, useCallback } from "react";

import sun from "/sun1.png"
import terminalIcon from "../assets/terminal.png";
import pdfIcon from "../assets/pdf.png";
import reactLogo from "../assets/react.svg";

interface AppState {
    id: number;
    name: string;
    icon: string;
    dimensions: { w: number; h: number };
}

export default function Taskbar() {
    const now = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });

    let appId = 1;

    const [apps, setApps] = useState<AppState[]>([
        { id: appId++, name: "Terminal", icon: terminalIcon, dimensions: { w: 20, h: 20 } },
        { id: appId++, name: "Resume", icon: pdfIcon, dimensions: { w: 20, h: 20 } },
        { id: appId++, name: "Andy Pham", icon: reactLogo, dimensions: { w: 20, h: 20 } },
    ]);

    return (
        <div className="taskbar">
            <div className="taskbar-left">
                <div className="start-button">
                    <img src={sun} width={28}/>
                </div>

                {apps.map(a => 
                    <div className="taskbar-app">
                        <img src={a.icon} width={a.dimensions.w} height={a.dimensions.h}/>
                    </div>
                )}
            </div>

            <div className="taskbar-right">
                {now}
            </div>
        </div>
    );
}