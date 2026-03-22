import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFProps {
    file: string;
}

export default function PDFViewer({file}: PDFProps) {
    return (
        <div
            style={{
                overflow: 'auto',
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
                <Page pageNumber={1} />
            </Document>
        </div>
        
    );
}