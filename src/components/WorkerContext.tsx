import { createContext, useRef, useContext } from "react";
import type {ReactNode} from "react";
import { attachFSHandler } from "./workerFS";

export const WorkerContext = createContext<Worker | null>(null);

export function WorkerProvider({ children }: { children: ReactNode }) {
    const workerRef = useRef<Worker | null>(null);

    if (!workerRef.current) {
        workerRef.current = new Worker(
            new URL("./terminal.worker.ts", import.meta.url),
            { type: "module" }
        );
        attachFSHandler(workerRef.current);
        workerRef.current.postMessage({ type: "ready" });
    }

    return (
        <WorkerContext.Provider value={workerRef.current}>
            {children}
        </WorkerContext.Provider>
    );
}

export function useWorker() {
    return useContext(WorkerContext)!;
}