import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
// import Terminal from "./components/Terminal.tsx";
import Desktop from "./components/Desktop.tsx"
// import Window from "./components/Window.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Desktop />
  </StrictMode>,
)
