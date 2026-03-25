import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import "./css/PDFViewer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFProps {
    file: string;
}

export default function PDFViewer({ file }: PDFProps) {
    const [zoom, setZoom] = useState(1);

    return (
        <div
            style={{ display: "flex", flexDirection: "column", height: "100%", background: "#1e1e1e" }}
            onClickCapture={e => {
                const link = (e.target as HTMLElement).closest("a");
                if (link) { e.preventDefault(); window.open(link.href, "_blank"); }
            }}
        >
            <div 
                className="zoom"
                style={{
                    display: "flex", 
                    gap: "8px", 
                    padding: "8px 12px",
                    background: "#161616", 
                    borderBottom: "1px solid #2a2a2a",
                    alignItems: "center", 
                    flexShrink: 0,
            }}>
                <button onClick={() => setZoom(z => Math.max(0.25, +(z - 0.1).toFixed(2)))}>−</button>
                <span style={{ color: "#888", fontSize: 12, minWidth: 40, textAlign: "center" }}>
                    {Math.round(zoom * 100)}%
                </span>
                <button onClick={() => setZoom(z => Math.min(3, +(z + 0.1).toFixed(2)))}>+</button>
                <button onClick={() => setZoom(1)} style={{ marginLeft: 4 }}>fit</button>
            </div>

            <div style={{ overflow: "auto", flex: 1, padding: "20px", display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
                <Document file={file}>
                    <Page pageNumber={1} scale={zoom} />
                </Document>
            </div>
        </div>
    );
}