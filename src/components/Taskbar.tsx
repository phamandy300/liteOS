import "./Taskbar.css";
import sun from "../assets/sun1.png"

export default function Taskbar() {
    const now = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });

    return (
        <div className="taskbar">
            <div className="taskbar-left">
                <div className="start-button">
                    <img src={sun} width={28}/>
                </div>

                <div className="taskbar-app">🖥️</div>
                <div className="taskbar-app">🌐</div>
            </div>

            <div className="taskbar-right">
                {now}
            </div>
        </div>
    );
}