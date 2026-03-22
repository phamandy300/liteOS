import "./App.css";

interface AppProps {
    name?: string;
    icon?: string;
    selected?: boolean;
    x?: number;
    y?: number;
    w?: number;
    h?: number;
    onClick?: () => void;
    onDoubleClick?: () => void;
}

export default function App({ 
    name, 
    icon,
    selected, 
    x, 
    y, 
    w, 
    h, 
    onClick, 
    onDoubleClick 
}: AppProps) {
    let clickTimer: ReturnType<typeof setTimeout> | null = null;

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (e.detail === 1) {
            // clickTimer = setTimeout(() => {
            //     onClick?.();
            // }, 200);
            onClick?.();
        } else if (e.detail === 2) {
            if (clickTimer) clearTimeout(clickTimer);
            onDoubleClick?.();
        }
    };

    return (
        <div
            className="app"
            style={{
                position: "absolute",
                left: x,
                top: y,
                cursor: "default",
                display: "inline-block",
                padding: "4px",
                borderRadius: "4px",
                ...(selected && {
                    background: "#d5dde361",
                    outline: "1px solid #ffffff89"
                })
            }}
            onClick={handleClick}
        >
            <div style={{ width: w, height: h }}>
                <img src={icon} width={w} height={h} draggable={false} />
            </div>

            <p style={{
                color: "white",
                fontSize: "12px",
                textAlign: "center",
                marginTop: "4px",
                width: w,
                whiteSpace: "normal",
                wordBreak: "break-word",
                textShadow: "0 1px 2px rgba(0,0,0,0.8)"
            }}>
                {name}
            </p>
        </div>
    );
}