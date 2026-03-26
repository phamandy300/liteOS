import { useEffect, useState, useRef } from "react";
import { useWorker } from "./WorkerContext";
import { workerFS, onFSInitialized } from "./workerFS";
import "./css/FileExplorer.css";

interface FSNode {
    name: string;
    path: string;
    isDir: boolean;
    children: FSNode[];
}

export default function FileExplorer() {
    const worker = useWorker();
    const fs = workerFS(worker);

    const pathMap = useRef(new Map<string, FSNode>());
    const [rootNode, setRootNode] = useState<FSNode | null>(null);
    const [backStack, setBackStack] = useState<FSNode[]>([]);
    const [forwardStack, setForwardStack] = useState<FSNode[]>([]);

    useEffect(() => {
        onFSInitialized(worker, () => readFS());

        const walkFileTree = async (path: string, node: FSNode) => {
            const name = path.split('/').pop()!;
            if (name === '.' || name === '..') return;

            try {
                const stat = await fs.stat(path);
                const isDir = (stat.mode & 0o170000) === 0o040000;

                const newNode: FSNode = { name, path, isDir, children: [] };
                node.children.push(newNode);
                pathMap.current.set(path, newNode);

                if (isDir) {
                    const children = await fs.readdir(path) as string[];
                    for (const child of children) {
                        if (child === '.' || child === '..') continue;
                        await walkFileTree(`${path}/${child}`, newNode);
                    }
                }
            } catch {}
        };

        const readFS = async () => {
            pathMap.current = new Map();
            const newRoot: FSNode = { name: "/", path: "/", isDir: true, children: [] };
            pathMap.current.set("/", newRoot);

            const root = await fs.readdir("/") as string[];
            for (const f of root.filter(f => f !== '.' && f !== '..')) {
                await walkFileTree(`/${f}`, newRoot);
            }

            setRootNode(newRoot);
        };

        readFS();
    }, []);

    const currDir = backStack[backStack.length - 1] ?? rootNode;

    const navigateTo = (node: FSNode) => {
        setBackStack(prev => [...prev, node]);
        setForwardStack([]);
    };

    const goBack = () => {
        if (backStack.length === 0) return;
        const last = backStack[backStack.length - 1];
        setBackStack(prev => prev.slice(0, -1));
        setForwardStack(prev => [...prev, last]);
    };

    const goForward = () => {
        if (forwardStack.length === 0) return;
        const last = forwardStack[forwardStack.length - 1];
        setForwardStack(prev => prev.slice(0, -1));
        setBackStack(prev => [...prev, last]);
    };

    const openFile = async (node: FSNode) => {
        const content = await fs.readFile(node.path) as string;
        const obj = JSON.parse(content);
        console.log(obj.name);
    };

    const displayTree = (node: FSNode) => (
        <div>
            {node.children?.map((child, index) => (
                <div
                    key={index}
                    style={{ background: "#161616", border: "1px solid white" }}
                    onDoubleClick={() => {
                        if (child.isDir) navigateTo(child);
                        else openFile(child);
                    }}
                >
                    <p style={{ marginLeft: 16, color: "white" }}>
                        {child.name}
                    </p>
                </div>
            ))}
        </div>
    );

    return (
        <div style={{ background: "#161616" }}>
            <div>
                <button onClick={goBack}>back</button>
                <button onClick={goForward}>forward</button>
            </div>
            {currDir && displayTree(currDir)}
        </div>
    );
}