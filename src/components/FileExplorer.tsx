import { useEffect, useState, useRef } from "react";
import "./css/FileExplorer.css";

interface FSNode {
    name: string;
    path: string;
    isDir: boolean;
    children: FSNode[];
}

export default function FileExplorer() {
    const pathMap = useRef(new Map<string, FSNode>());
    const [rootNode, setRootNode] = useState<FSNode | null>(null);
    // const [currDir, setCurrDir] = useState<FSNode | null>(null);
    const [backStack, setBackStack] = useState<FSNode[]>([]);
    const [forwardStack, setForwardStack] = useState<FSNode[]>([]);

    useEffect(() => {
        const walkFileTree = (path: string, node: FSNode) => {
            const name = path.split('/').pop()!;
            if (name === '.' || name === '..') return;
            
            try {
                const stat = window.Module.FS.stat(path);
                const isDir = window.Module.FS.isDir(stat.mode);

                const newNode: FSNode = {
                    name: name,
                    path: path,
                    isDir: isDir,
                    children: []
                };

                node.children.push(newNode);
                pathMap.current.set(path, newNode);

                if (isDir) {
                    const children = window.Module.FS.readdir(path);
                    for (const child of children) {
                        if (child === '.' || child === '..') continue;
                        walkFileTree(`${path}/${child}`, newNode);
                    }
                }
            } catch(e) {}
        };

        const readFS = () => {
            pathMap.current = new Map();
            const newRoot: FSNode = { name: "/", path: "/", isDir: true, children: [] };
            pathMap.current.set("/", newRoot);

            const root = window.Module.FS.readdir('/');
            root.filter((f: string) => f !== '.' && f !== '..').forEach((f: string) => walkFileTree(`/${f}`, newRoot));

            setRootNode(newRoot);

            // console.log(newRoot);
            // console.log(pathMap.current);
        };

        if (window.Module?.FS) {
            readFS();
        } else {
            const prev = window.__onModuleReady;
            window.__onModuleReady = () => {
                prev?.();
                readFS();
            };
        }

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

    const openFile = (node: FSNode) => {
        const content = window.Module.FS.readFile(node.path, {encoding: "utf8"})
        const obj = JSON.parse(content);

        return console.log(obj.name);
    };

    const displayTree = (node: FSNode) => {
         return (
            <div>
                {node.children?.map((child, index) => (
                    <div 
                        key={index} 
                        style={{ 
                            background: "#161616",
                            border: "1px solid white,"
                        }} 
                        onDoubleClick={() => {
                            if (child.isDir) {
                                navigateTo(child)
                            }
                            else {
                                openFile(child);
                            }
                        }}
                    >
                        <p 
                            style={{ 
                                marginLeft: 16, 
                                color: "white" 
                            }}
                        >
                            {child.name}
                        </p>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div 
            style={{ 
                background: "#161616", 
            }} 
        >
            <div>
                <button onClick={()=>goBack()}>back</button>
                <button onClick={()=>goForward()}>forward</button>
            </div>
            {currDir && displayTree(currDir)}
        </div>
    );
}