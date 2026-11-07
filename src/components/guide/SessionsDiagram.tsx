'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Check, ClipboardList, LayoutList, ShieldCheck, X } from 'lucide-react';
import { DemoFrame, useStepLoop } from '@/components/guide/primitives';

const TASKS = ['Clean the data', 'Run the models', 'Draft the tables'];
const COLUMNS = ['To do', 'Doing', 'Done'];

/**
 * The animation runs through ten beats, grouped into the four steps the caption describes.
 * Everything drawn is a pure function of the beat, so jumping to a step needs no extra state.
 *   0 planning session lights up     1 cards appear in To do
 *   2 cards travel to the workers    3 progress bars fill
 *   4 results travel to the checker  5 two ticks
 *   6 a cross, and the card returns  7 the worker redoes it
 *   8 all cards reach Done           9 a session ends and a new one reads the board
 * The last beat lasts as long as FINAL_HOLD. Total loop: 25 seconds.
 */
const BEATS = [800, 4000, 1800, 3000, 1300, 1300, 4700, 2300, 1300, 0];
const FINAL_HOLD = 4500;

const STEPS = [
    { label: 'Plan', text: 'The planning session splits the work into cards. Each card states the goal and how we will know it is done.', first: 0, last: 1 },
    { label: 'Do', text: 'Each card runs in its own session: the strongest model for judgement calls, a cheaper one for routine work.', first: 2, last: 3 },
    { label: 'Check', text: 'A new session checks each result against its card. The session that did the work should not be the only one to check it.', first: 4, last: 6 },
    { label: 'Record', text: 'One file lists every card and its status. Each new session reads it before starting.', first: 7, last: 9 },
];

const DESCRIPTION =
    'Diagram of one paper handled by many sessions. A planning session splits the work into three cards on a task board. Three worker sessions each take one card. A fresh session checks each result, passes two and sends the third back to its worker, which redoes it. All three cards reach Done on the board. When a worker session ends, a new one reads the board and continues the work, so progress is kept.';

const ease = [0.22, 1, 0.36, 1] as const;

function stepOf(beat: number) {
    return STEPS.findIndex((step) => beat <= step.last);
}

/** A box: x and w are fractions of the stage width, y and h are pixels. */
interface Box {
    x: number;
    w: number;
    y: number;
    h: number;
}

interface Layout {
    horizontal: boolean;
    height: number;
    planning: Box;
    workers: Box[];
    fresh: Box;
    board: Box;
}

const HORIZONTAL: Layout = {
    horizontal: true,
    height: 288,
    planning: { x: 0.075, w: 0.15, y: 94, h: 100 },
    workers: [
        { x: 0.345, w: 0.21, y: 0, h: 88 },
        { x: 0.345, w: 0.21, y: 100, h: 88 },
        { x: 0.345, w: 0.21, y: 200, h: 88 },
    ],
    fresh: { x: 0.615, w: 0.17, y: 79, h: 130 },
    board: { x: 0.865, w: 0.27, y: 0, h: 288 },
};

const VERTICAL: Layout = {
    horizontal: false,
    height: 562,
    planning: { x: 0.5, w: 0.62, y: 0, h: 52 },
    workers: [
        { x: 0.16, w: 0.31, y: 96, h: 104 },
        { x: 0.5, w: 0.31, y: 96, h: 104 },
        { x: 0.84, w: 0.31, y: 96, h: 104 },
    ],
    fresh: { x: 0.45, w: 0.72, y: 240, h: 112 },
    board: { x: 0.5, w: 1, y: 372, h: 190 },
};

function edges(box: Box, width: number) {
    return {
        left: (box.x - box.w / 2) * width,
        right: (box.x + box.w / 2) * width,
        centre: box.x * width,
        top: box.y,
        bottom: box.y + box.h,
        middle: box.y + box.h / 2,
    };
}

function curveAcross(x1: number, y1: number, x2: number, y2: number) {
    const mid = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${mid} ${y1} ${mid} ${y2} ${x2} ${y2}`;
}

function curveDown(x1: number, y1: number, x2: number, y2: number) {
    const mid = (y1 + y2) / 2;
    return `M ${x1} ${y1} C ${x1} ${mid} ${x2} ${mid} ${x2} ${y2}`;
}

/** Every line in the diagram, in pixels, for the measured stage width. */
function buildPaths(layout: Layout, width: number) {
    const planning = edges(layout.planning, width);
    const workers = layout.workers.map((box) => edges(box, width));
    const fresh = edges(layout.fresh, width);
    const board = edges(layout.board, width);
    const third = workers[2];

    if (layout.horizontal) {
        const backY = third.top + 48;
        const readY = third.bottom - 16;
        return {
            toWorker: workers.map((w) => curveAcross(planning.right, planning.middle, w.left, w.middle)),
            toFresh: workers.map((w, i) => curveAcross(w.right, w.middle, fresh.left, fresh.top + layout.fresh.h * (0.3 + 0.2 * i))),
            back: `M ${fresh.centre} ${fresh.bottom} C ${fresh.centre} ${backY} ${fresh.centre - 20} ${backY} ${third.right} ${backY}`,
            read: `M ${board.left} ${readY} L ${third.right} ${readY}`,
        };
    }

    const backX = width * 0.88;
    const backY = fresh.top + 24;
    const readX = width * 0.96;
    return {
        toWorker: workers.map((w) => curveDown(planning.centre, planning.bottom, w.centre, w.top)),
        toFresh: workers.map((w, i) => curveDown(w.centre, w.bottom, fresh.left + (fresh.right - fresh.left) * (0.25 + 0.25 * i), fresh.top)),
        back: `M ${fresh.right} ${backY} C ${backX} ${backY} ${backX} ${(backY + third.bottom) / 2} ${backX} ${third.bottom}`,
        read: `M ${readX} ${board.top} L ${readX} ${third.bottom}`,
    };
}

function boxStyle(box: Box) {
    return { left: `${(box.x - box.w / 2) * 100}%`, top: box.y, width: `${box.w * 100}%`, height: box.h };
}

function nodeClass(active: boolean) {
    return `absolute z-10 rounded-xl border bg-background shadow-sm transition-colors duration-500 ${active ? 'border-accent' : 'border-neutral-300'}`;
}

function NodeIcon({ icon: Icon }: { icon: typeof Bot }) {
    return (
        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
    );
}

/** A line that draws itself in accent colour when active. */
function DrawnLine({ d, active, delay = 0, duration = 1, reduced, width = 1.75 }: { d: string; active: boolean; delay?: number; duration?: number; reduced: boolean; width?: number }) {
    let transition;
    if (reduced) transition = { duration: 0 };
    else if (active) transition = { pathLength: { delay, duration, ease: 'easeInOut' as const }, opacity: { delay, duration: 0.2 } };
    else transition = { opacity: { duration: 0.4 }, pathLength: { delay: 0.4, duration: 0 } };
    return (
        <motion.path
            d={d}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={width}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={active ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
            transition={transition}
        />
    );
}

/** Something that moves along a path once, then fades. It remounts for each run, so it always starts at the source. */
function Traveller({ path, delay = 0, duration = 1, children }: { path: string; delay?: number; duration?: number; children: React.ReactNode }) {
    return (
        <motion.div
            className="absolute left-0 top-0 z-20"
            style={{ offsetPath: `path("${path}")`, offsetRotate: '0deg' }}
            initial={{ offsetDistance: '0%', opacity: 0 }}
            animate={{ offsetDistance: '100%', opacity: [0, 1, 1, 0] }}
            transition={{
                offsetDistance: { delay, duration, ease: [0.45, 0, 0.55, 1] },
                opacity: { delay, duration, times: [0, 0.12, 0.9, 1] },
            }}
        >
            {children}
        </motion.div>
    );
}

function MiniCard() {
    return (
        <span className="flex h-[18px] w-[26px] flex-col justify-center gap-[3px] rounded-[4px] border border-accent bg-background px-[4px]">
            <span className="block h-px w-full bg-accent" />
            <span className="block h-px w-2/3 bg-accent" />
        </span>
    );
}

function ReturnedCard() {
    return (
        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-accent bg-background px-1.5 py-0.5 text-[11px] font-medium text-accent shadow-sm">
            <X className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
            {TASKS[2]}
        </span>
    );
}

function PlanningNode({ layout, beat }: { layout: Layout; beat: number }) {
    return (
        <div className={nodeClass(beat <= 2)} style={boxStyle(layout.planning)}>
            <div className={`flex h-full items-center justify-center gap-2 p-2 ${layout.horizontal ? 'flex-col text-center' : ''}`}>
                <NodeIcon icon={ClipboardList} />
                <span className="text-sm font-semibold leading-snug text-primary">Planning session</span>
            </div>
        </div>
    );
}

function WorkerHeader({ horizontal }: { horizontal: boolean }) {
    return (
        <span className={`flex items-center gap-1.5 text-primary ${horizontal ? '' : 'flex-col gap-0.5 text-center'}`}>
            <Bot className="h-4 w-4 flex-shrink-0 text-accent" aria-hidden="true" />
            <span className={`font-semibold leading-tight ${horizontal ? 'text-xs' : 'text-[11px]'}`}>Worker session</span>
        </span>
    );
}

function WorkerNode({ index, layout, beat, reduced }: { index: number; layout: Layout; beat: number; reduced: boolean }) {
    const { horizontal } = layout;
    const isThird = index === 2;
    const hasCard = beat >= 3;
    const flagged = isThird && beat === 6;
    const ended = isThird && beat === 9;
    const active = (beat >= 2 && beat <= 3) || (isThird && beat >= 6 && beat <= 7) || ended;
    const dim = !isThird && beat === 6;
    const empty = beat < 3 || flagged;
    const speed = [1.3, 2.7, 2][index];
    const chipHeight = horizontal ? 'h-6' : 'h-[32px]';
    const textSize = horizontal ? 'text-xs' : 'text-[11px]';

    let barTransition;
    if (reduced) barTransition = { duration: 0 };
    else if (beat === 3) barTransition = { duration: speed, ease: 'easeInOut' as const };
    else if (flagged) barTransition = { delay: 2.8, duration: 0.4 };
    else if (isThird && beat === 7) barTransition = { duration: 1.1, ease: 'easeInOut' as const };
    else barTransition = { duration: 0.4 };

    return (
        <motion.div className={nodeClass(active)} style={boxStyle(layout.workers[index])} initial={false} animate={{ opacity: dim ? 0.65 : 1 }} transition={{ duration: reduced ? 0 : 0.5 }}>
            <motion.div
                className={`flex h-full flex-col justify-center ${horizontal ? 'gap-1.5 p-2.5' : 'gap-1 p-1.5'}`}
                initial={false}
                animate={{ opacity: ended ? 0 : 1 }}
                transition={reduced ? { duration: 0 } : ended ? { delay: 0.8, duration: 0.6 } : { duration: 0.4 }}
            >
                <WorkerHeader horizontal={horizontal} />
                <span className={`relative flex items-center justify-center rounded-md border border-dashed border-neutral-300 px-1 text-center leading-tight ${chipHeight} ${textSize}`}>
                    <motion.span
                        className="absolute inset-[-1px] rounded-md border border-neutral-300 bg-neutral-100"
                        initial={false}
                        animate={{ opacity: hasCard ? 1 : 0 }}
                        transition={{ duration: reduced ? 0 : 0.5 }}
                    />
                    <motion.span
                        className="absolute inset-[-1px] rounded-md border border-accent bg-accent/10"
                        initial={false}
                        animate={{ opacity: flagged ? 1 : 0 }}
                        transition={reduced ? { duration: 0 } : flagged ? { delay: 2.8, duration: 0.4 } : { duration: 0.4 }}
                    />
                    <motion.span className="relative text-primary" initial={false} animate={{ opacity: hasCard ? 1 : 0 }} transition={{ duration: reduced ? 0 : 0.5 }}>
                        {TASKS[index]}
                    </motion.span>
                </span>
                <span className="block h-[5px] overflow-hidden rounded-full bg-neutral-200">
                    <motion.span className="block h-full origin-left rounded-full bg-accent" initial={false} animate={{ scaleX: empty ? 0 : 1 }} transition={barTransition} />
                </span>
            </motion.div>

            {isThird && (
                <>
                    <motion.div
                        className={`absolute inset-0 flex flex-col justify-center ${horizontal ? 'gap-1.5 p-2.5' : 'gap-1 p-1.5'}`}
                        initial={false}
                        animate={{ opacity: ended ? 1 : 0 }}
                        transition={reduced ? { duration: 0 } : ended ? { delay: 1.3, duration: 0.6 } : { duration: 0.3 }}
                    >
                        <WorkerHeader horizontal={horizontal} />
                        <span className={`flex items-center justify-center rounded-md border border-accent bg-accent/10 px-1 text-center leading-tight text-primary ${chipHeight} ${textSize}`}>
                            Reading the board
                        </span>
                    </motion.div>
                    <motion.span
                        className="absolute left-1/2 -top-3 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-neutral-300 bg-neutral-100 px-2 py-0.5 text-[11px] font-medium leading-tight text-primary"
                        initial={false}
                        animate={ended ? { opacity: reduced ? 1 : [0, 1, 1, 0] } : { opacity: 0 }}
                        transition={reduced ? { duration: 0 } : ended ? { duration: 2.6, times: [0, 0.15, 0.85, 1] } : { duration: 0.2 }}
                    >
                        Session ended
                    </motion.span>
                </>
            )}
        </motion.div>
    );
}

type Verdict = 'none' | 'tick' | 'cross';

function verdictFor(index: number, beat: number): Verdict {
    if (index < 2) return beat >= 5 ? 'tick' : 'none';
    if (beat >= 8) return 'tick';
    return beat === 6 || beat === 7 ? 'cross' : 'none';
}

function FreshNode({ layout, beat, reduced }: { layout: Layout; beat: number; reduced: boolean }) {
    const active = (beat >= 4 && beat <= 6) || beat === 8;
    return (
        <div className={nodeClass(active)} style={boxStyle(layout.fresh)}>
            <div className="flex h-full flex-col justify-center gap-1 p-2">
                <div className="flex items-center gap-2">
                    <NodeIcon icon={ShieldCheck} />
                    <span className="text-sm font-semibold leading-snug text-primary">Fresh session</span>
                </div>
                <ul className="m-0 list-none p-0">
                    {TASKS.map((task, index) => {
                        const verdict = verdictFor(index, beat);
                        const shown = beat >= 4;
                        return (
                            <li key={task} className="relative flex h-[22px] items-center justify-between gap-1 rounded px-1 text-[11px] leading-tight text-primary">
                                <span className="absolute inset-x-1 top-1/2 h-1 -translate-y-1/2 rounded-full bg-neutral-200" style={{ opacity: shown ? 0 : 1, transition: 'opacity 0.4s' }} />
                                <motion.span
                                    className="absolute inset-0 rounded bg-accent/10"
                                    initial={false}
                                    animate={{ opacity: verdict === 'cross' ? 1 : 0 }}
                                    transition={{ duration: reduced ? 0 : 0.5 }}
                                />
                                <motion.span
                                    className="relative"
                                    initial={false}
                                    animate={{ opacity: shown ? 1 : 0 }}
                                    transition={reduced ? { duration: 0 } : beat === 4 ? { delay: 0.8 + index * 0.1, duration: 0.4 } : { duration: 0.3 }}
                                >
                                    {task}
                                </motion.span>
                                <span className="relative h-3.5 w-3.5 flex-shrink-0">
                                    <motion.span
                                        className="absolute inset-0 text-neutral-600 dark:text-neutral-500"
                                        initial={false}
                                        animate={{ opacity: verdict === 'tick' ? 1 : 0 }}
                                        transition={reduced ? { duration: 0 } : beat === 5 ? { delay: index * 0.5, duration: 0.5 } : { duration: 0.4 }}
                                    >
                                        <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
                                    </motion.span>
                                    <motion.span
                                        className="absolute inset-0 text-accent"
                                        initial={false}
                                        animate={{ opacity: verdict === 'cross' ? 1 : 0 }}
                                        transition={reduced ? { duration: 0 } : { delay: verdict === 'cross' ? 0.2 : 0, duration: 0.4 }}
                                    >
                                        <X className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
                                    </motion.span>
                                </span>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}

function BoardNode({ layout, beat, reduced }: { layout: Layout; beat: number; reduced: boolean }) {
    const cardHeight = layout.horizontal ? 64 : 36;
    const cardGap = layout.horizontal ? 8 : 4;
    const active = beat === 1 || beat === 2 || beat >= 8;
    const column = beat >= 8 ? 2 : beat >= 2 ? 1 : 0;
    const shown = beat >= 1;

    return (
        <div className={nodeClass(active)} style={boxStyle(layout.board)}>
            <div className="flex h-full flex-col p-2">
                <div className="flex items-center gap-2">
                    <NodeIcon icon={LayoutList} />
                    <span className="text-sm font-semibold leading-snug text-primary">Task board</span>
                </div>
                <div className="relative mt-1 flex-1">
                    <div className="absolute inset-0 grid grid-cols-3">
                        {COLUMNS.map((name) => (
                            <div key={name} className="h-full px-[2px]">
                                <div className="h-full rounded-lg bg-neutral-100 pt-1 text-center text-[11px] font-semibold leading-4 text-neutral-600 dark:text-neutral-500">{name}</div>
                            </div>
                        ))}
                    </div>
                    {TASKS.map((task, index) => {
                        let transition;
                        if (reduced) transition = { duration: 0 };
                        else if (!shown) transition = { opacity: { duration: 0.4 }, left: { delay: 0.5, duration: 0 } };
                        else if (beat === 1) transition = { opacity: { delay: index * 0.7, duration: 0.6 }, left: { duration: 0 } };
                        else transition = { opacity: { duration: 0.3 }, left: { delay: index * 0.3, duration: 0.9, ease } };
                        return (
                            <motion.div
                                key={task}
                                className="absolute w-1/3 px-[5px]"
                                style={{ top: 24 + index * (cardHeight + cardGap) }}
                                initial={false}
                                animate={{ left: `${(column * 100) / 3}%`, opacity: shown ? 1 : 0 }}
                                transition={transition}
                            >
                                <span
                                    className={`card-bg flex items-center justify-center rounded-md border px-1 text-center text-[11px] leading-tight text-primary transition-colors duration-500 ${
                                        index === 2 && beat === 6 ? 'border-accent' : 'border-neutral-300'
                                    }`}
                                    style={{ height: cardHeight }}
                                >
                                    {task}
                                </span>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function useWidth() {
    const ref = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);
    useEffect(() => {
        const element = ref.current;
        if (!element) return;
        const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
        observer.observe(element);
        return () => observer.disconnect();
    }, []);
    return { ref, width };
}

/** The diagram for one layout. The hidden layout has zero width, so it draws no lines and no travellers. */
function Stage({ layout, beat, reduced, className }: { layout: Layout; beat: number; reduced: boolean; className: string }) {
    const { ref, width } = useWidth();
    const paths = useMemo(() => (width ? buildPaths(layout, width) : null), [layout, width]);

    return (
        <div ref={ref} className={`relative ${className}`} style={{ height: layout.height }}>
            {paths && (
                <svg aria-hidden="true" className="absolute inset-0 overflow-visible" width={width} height={layout.height}>
                    <g fill="none" stroke="var(--neutral-400)" strokeWidth={1}>
                        {paths.toWorker.map((d) => (
                            <path key={d} d={d} />
                        ))}
                        {paths.toFresh.map((d) => (
                            <path key={d} d={d} />
                        ))}
                    </g>
                    {paths.toWorker.map((d, index) => (
                        <DrawnLine key={d} d={d} active={beat === 2} delay={index * 0.2} duration={1.2} reduced={reduced} />
                    ))}
                    {paths.toFresh.map((d, index) => (
                        <DrawnLine
                            key={d}
                            d={d}
                            active={beat === 4 || (index === 2 && beat === 7)}
                            delay={beat === 7 ? 1.1 : index * 0.1}
                            duration={0.9}
                            reduced={reduced}
                        />
                    ))}
                    <DrawnLine d={paths.back} active={beat === 6} delay={0.4} duration={2.4} reduced={reduced} width={2.25} />
                    <DrawnLine d={paths.read} active={beat === 9} delay={1.5} duration={0.9} reduced={reduced} />
                </svg>
            )}

            <PlanningNode layout={layout} beat={beat} />
            {layout.workers.map((_, index) => (
                <WorkerNode key={index} index={index} layout={layout} beat={beat} reduced={reduced} />
            ))}
            <FreshNode layout={layout} beat={beat} reduced={reduced} />
            <BoardNode layout={layout} beat={beat} reduced={reduced} />

            {paths && !reduced && (
                <>
                    {beat === 2 &&
                        paths.toWorker.map((d, index) => (
                            <Traveller key={d} path={d} delay={index * 0.2} duration={1.2}>
                                <MiniCard />
                            </Traveller>
                        ))}
                    {beat === 4 &&
                        paths.toFresh.map((d, index) => (
                            <Traveller key={d} path={d} delay={index * 0.1} duration={0.9}>
                                <MiniCard />
                            </Traveller>
                        ))}
                    {beat === 6 && (
                        <Traveller path={paths.back} delay={0.6} duration={2.2}>
                            <ReturnedCard />
                        </Traveller>
                    )}
                    {beat === 7 && (
                        <Traveller path={paths.toFresh[2]} delay={1.1} duration={0.9}>
                            <MiniCard />
                        </Traveller>
                    )}
                    {beat === 9 && (
                        <Traveller path={paths.read} delay={1.6} duration={1}>
                            <MiniCard />
                        </Traveller>
                    )}
                </>
            )}
        </div>
    );
}

export default function SessionsDiagram() {
    const loop = useStepLoop(BEATS, { hold: FINAL_HOLD });
    const { reduced } = loop;
    const [pinned, setPinned] = useState<number | null>(null);
    const beat = pinned ?? loop.step;
    const current = stepOf(beat);

    // A chosen step plays through its own beats, then stays on the last one.
    useEffect(() => {
        if (pinned === null || reduced || pinned >= STEPS[stepOf(pinned)].last) return;
        const timer = setTimeout(() => setPinned((p) => (p === null ? p : p + 1)), BEATS[pinned]);
        return () => clearTimeout(timer);
    }, [pinned, reduced]);

    const replay = () => {
        setPinned(null);
        loop.replay();
    };

    return (
        <DemoFrame caption="An animation of how I organise a paper." onReplay={reduced ? undefined : replay}>
            <div ref={loop.ref} className="card-bg rounded-2xl border border-neutral-200 p-3 shadow-sm dark:border-neutral-800 sm:p-5 lg:p-6">
                <div role="img" aria-label={DESCRIPTION}>
                    <Stage layout={HORIZONTAL} beat={beat} reduced={reduced} className="hidden lg:block" />
                    <Stage layout={VERTICAL} beat={beat} reduced={reduced} className="mx-auto max-w-[560px] lg:hidden" />
                </div>

                {/* The hidden copies reserve the height of the longest caption, so nothing jumps. */}
                <div className="mt-5 grid border-t border-neutral-200 pt-4 text-sm leading-relaxed text-neutral-700 dark:border-neutral-800 dark:text-neutral-600 sm:text-[15px]">
                    <p className="m-0 [grid-area:1/1]">
                        <motion.span
                            key={current}
                            className="block"
                            initial={reduced ? false : { opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease }}
                        >
                            <strong className="font-serif font-semibold text-accent">{STEPS[current].label}.</strong> {STEPS[current].text}
                        </motion.span>
                    </p>
                    <p className="sr-only" aria-live="polite" aria-atomic="true">{pinned === null ? '' : `${STEPS[current].label}. ${STEPS[current].text}`}</p>
                    {STEPS.map((step) => (
                        <p key={step.label} aria-hidden="true" className="invisible m-0 [grid-area:1/1]">
                            <strong className="font-serif font-semibold">{step.label}.</strong> {step.text}
                        </p>
                    ))}
                </div>

                <div role="group" aria-label="Jump to a step" className="mt-4 grid grid-cols-4 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
                    {STEPS.map((step, index) => {
                        const selected = index === current;
                        return (
                            <button
                                key={step.label}
                                type="button"
                                aria-label={`Step ${index + 1}: ${step.label}`}
                                aria-current={selected ? 'step' : undefined}
                                onClick={() => setPinned(reduced ? step.last : step.first)}
                                className={`inline-flex min-h-9 items-center justify-center gap-1 rounded-full px-1 text-xs font-medium outline-offset-2 transition-colors focus-visible:outline-2 focus-visible:outline-accent sm:px-4 sm:text-sm ${
                                    selected ? 'bg-accent text-white dark:text-neutral-50' : 'bg-neutral-100 text-neutral-600 hover:text-primary dark:bg-neutral-800 dark:text-neutral-500'
                                }`}
                            >
                                <span className="tabular-nums opacity-70" aria-hidden="true">
                                    {index + 1}
                                </span>
                                {step.label}
                            </button>
                        );
                    })}
                </div>
                <p className={`m-0 mt-2 text-xs leading-4 text-neutral-500 ${pinned !== null && !reduced ? '' : 'invisible'}`}>Paused. Press Replay to resume.</p>
            </div>
        </DemoFrame>
    );
}
