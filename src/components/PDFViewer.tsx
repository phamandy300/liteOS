import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFProps {
    file: string;
}

export default function PDFViewer({file}: PDFProps) {
    return (
        <Document file={file}>
            <Page pageNumber={1} />
        </Document>
    );
}