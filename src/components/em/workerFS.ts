let reqId = 0;
const pending = new Map<number, (result: any) => void>();

export function attachFSHandler(worker: Worker) {
    worker.addEventListener("message", (e) => {
        const { type, id, result } = e.data;
        if (type === "fs:result" && pending.has(id)) {
            pending.get(id)!(result);
            pending.delete(id);
        }
    });
}

export function onFSInitialized(worker: Worker, callback: () => void) {
    worker.addEventListener("message", (e) => {
        if (e.data.type === "fs:initialized") callback();
    }, { once: true });
}

export function fsRequest(worker: Worker, op: string, payload: object): Promise<any> {
    return new Promise(resolve => {
        const id = reqId++;
        pending.set(id, resolve);
        worker.postMessage({ type: "fs:request", id, op, ...payload });
    });
}

export function onFSReady(worker: Worker, callback: () => void) {
    worker.addEventListener("message", (e) => {
        if (e.data.type === "fs:ready") callback();
    }, { once: true });
    worker.postMessage({ type: "fs:ping" });
}

export const workerFS = (worker: Worker) => ({
    readdir:   (path: string) => fsRequest(worker, "readdir",   { path }),
    stat:      (path: string) => fsRequest(worker, "stat",      { path }),
    readFile:  (path: string) => fsRequest(worker, "readFile",  { path }),
    mkdir:     (path: string) => fsRequest(worker, "mkdir",     { path }),
    rmdir:     (path: string) => fsRequest(worker, "rmdir",     { path }),
    writeFile: (path: string, data: string) => fsRequest(worker, "writeFile", { path, data }),
});