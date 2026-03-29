// import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import Desktop from "./components/Desktop.tsx"
import { WorkerProvider } from "./components/em/WorkerContext.tsx"

createRoot(document.getElementById("root")!).render(
    <WorkerProvider>
        <Desktop />
    </WorkerProvider>
)
