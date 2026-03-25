import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFProps {
    file: string;
}

export default function PDFViewer({ file }: PDFProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);

    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setWidth(containerRef.current.offsetWidth - 40);
            }
        };

        updateWidth();
        window.addEventListener("resize", updateWidth);
        return () => window.removeEventListener("resize", updateWidth);
    }, []);

    return (
        <div
            ref={containerRef}
            style={{
                overflow: "auto",
                background: "#1e1e1e",
                padding: "20px",
                display: "flex",
                justifyContent: "center"
            }}
            onClickCapture={e => {
                const link = (e.target as HTMLElement).closest("a");
                if (link) {
                    e.preventDefault();
                    window.open(link.href, "_blank");
                }
            }}
        >
            <Document file={file}>
                <Page pageNumber={1} width={width} />
            </Document>
        </div>
    );
}