import { useContext } from "react";
import { WorkerContext } from "./WorkerContext";

export function useWorker() {
    return useContext(WorkerContext)!;
}