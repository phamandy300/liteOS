import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
}

export interface ParticleBackgroundHandle {
    addParticle: (x: number, y: number) => void;
}

const PARTICLE_COUNT = 90;
const MAX_DIST = 180;
const MOUSE_RADIUS = 120;
const MOUSE_FORCE = 0.3;
const SPEED = 0.25;

function makeParticle(x?: number, y?: number, w = window.innerWidth, h = window.innerHeight): Particle {
    return {
        x: x ?? Math.random() * w,
        y: y ?? Math.random() * h,
        vx: (Math.random() - 0.5) * SPEED,
        vy: (Math.random() - 0.5) * SPEED,
        size: Math.random() * 1.5 + 1.5,
        // opacity: Math.random() * 0.4 + 0.6,
        opacity: 1,
    };
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, opacity: number) {
    const spikes = 4;
    const inner = r * 0.35;
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    for (let i = 0; i < spikes; i++) {
        ctx.lineTo(x + Math.cos(rot) * r, y + Math.sin(rot) * r);
        rot += step;
        ctx.lineTo(x + Math.cos(rot) * inner, y + Math.sin(rot) * inner);
        rot += step;
    }
    ctx.closePath();
    ctx.fillStyle = `rgba(15, 28, 112, ${opacity})`;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, r * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(120, 180, 255, ${opacity * 0.8})`;
    ctx.fill();
}

const ParticleBackground = forwardRef<ParticleBackgroundHandle>((_, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouse = useRef({ x: -9999, y: -9999 });
    const particles = useRef<Particle[]>([]);
    const rafId = useRef<number>(0);

    useImperativeHandle(ref, () => ({
        addParticle(x: number, y: number) {
            for (let i = 0; i < 3; i++) {
                particles.current.push(makeParticle(
                    x + (Math.random() - 0.5) * 20,
                    y + (Math.random() - 0.5) * 20,
                ));
            }
        }
    }));

    useEffect(() => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        particles.current = Array.from({ length: PARTICLE_COUNT }, () => makeParticle());

        const onMouseMove = (e: MouseEvent) => { mouse.current = { x: e.clientX, y: e.clientY }; };
        const onMouseLeave = () => { mouse.current = { x: -9999, y: -9999 }; };
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseleave", onMouseLeave);

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (const p of particles.current) {
                const dx = mouse.current.x - p.x;
                const dy = mouse.current.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < MOUSE_RADIUS && dist > 0) {
                    const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
                    p.vx -= (dx / dist) * force * MOUSE_FORCE;
                    p.vy -= (dy / dist) * force * MOUSE_FORCE;
                }

                for (const other of particles.current) {
                    if (other === p) continue;
                    const dx = p.x - other.x;
                    const dy = p.y - other.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 60 && dist > 0) {
                        const force = (60 - dist) / 60 * 0.015;
                        p.vx += (dx / dist) * force;
                        p.vy += (dy / dist) * force;
                    }
                }

                p.vx *= 0.99;
                p.vy *= 0.99;

                const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                if (speed < SPEED * 0.4) {
                    p.vx += (Math.random() - 0.5) * 0.04;
                    p.vy += (Math.random() - 0.5) * 0.04;
                }

                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                drawStar(ctx, p.x, p.y, p.size, p.opacity);
            }

            const pts = particles.current;
            ctx.setLineDash([4, 4]);
            for (let i = 0; i < pts.length; i++) {
                for (let j = i + 1; j < pts.length; j++) {
                    const dx = pts[i].x - pts[j].x;
                    const dy = pts[i].y - pts[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < MAX_DIST) {
                        const alpha = (1 - dist / MAX_DIST) * 0.50;
                        ctx.beginPath();
                        ctx.moveTo(pts[i].x, pts[i].y);
                        ctx.lineTo(pts[j].x, pts[j].y);
                        ctx.strokeStyle = `rgba(15, 28, 112, ${alpha})`;
                        ctx.lineWidth = 0.3;
                        ctx.stroke();
                    }
                }
            }
            ctx.setLineDash([]);

            rafId.current = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(rafId.current);
            window.removeEventListener("resize", resize);
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseleave", onMouseLeave);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: 0,
                pointerEvents: "none",
            }}
        />
    );
});

export default ParticleBackground;