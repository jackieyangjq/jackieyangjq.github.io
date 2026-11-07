'use client';

import { useEffect, useId, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { CheckCircle2, Cloud, Cpu, FileText, RotateCcw, Timer } from 'lucide-react';
import { GuideFoldItem } from '@/types/page';
import { FoldDemoProps } from './demoProps';
import { term, TerminalWindow, Typed, useStepLoop } from './primitives';

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
const PAPER_ACCENT = '#8b1e2d'; // the Word page stays white in both themes, so it keeps the light-theme crimson
// Note: the site inverts the neutral scale in dark mode, so a plain neutral class already adapts to the theme.

const ease = (reduced: boolean, duration = 0.6) => ({ duration: reduced ? 0 : duration, ease: 'easeInOut' as const });

/** useStepLoop plus a pinned step: pressing a control stops the loop at that state until the reader replays. */
function useFoldLoop(durations: number[], hold: number) {
    const { ref, step, replay, reduced } = useStepLoop(durations, { hold });
    const visible = useInView(ref, { amount: 0.3 });
    const [pinned, setPinned] = useState<number | null>(null);
    const resume = () => {
        setPinned(null);
        replay();
    };
    return { ref, step: pinned ?? step, pin: setPinned, pinned: pinned !== null, resume, reduced, visible };
}

function Stage({ label, loopRef, controls, children }: { label: string; loopRef: React.Ref<HTMLDivElement>; controls: React.ReactNode; children: React.ReactNode }) {
    return (
        <div ref={loopRef}>
            <div role="img" aria-label={label} className="relative h-[196px]">
                {children}
            </div>
            <div className="mt-3 flex min-h-[34px] items-center gap-2">{controls}</div>
        </div>
    );
}

function ReplayButton({ show, onClick }: { show: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label="Replay the animation"
            title="Replay"
            className={`ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg text-accent transition-colors hover:bg-accent/10 ${FOCUS} ${show ? '' : 'invisible'}`}
        >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
    );
}

function PlainButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex h-8 items-center rounded-lg border border-neutral-300 px-3 text-xs font-medium text-primary transition-colors hover:border-accent hover:text-accent ${FOCUS}`}
        >
            {children}
        </button>
    );
}

/** Two pressed-or-not buttons that show and set which of two states the visual is in. */
function Toggle({ label, options }: { label: string; options: { text: string; active: boolean; onClick: () => void }[] }) {
    return (
        <div role="group" aria-label={label} className="inline-flex rounded-lg border border-neutral-300 p-0.5">
            {options.map((option) => (
                <button
                    key={option.text}
                    type="button"
                    aria-pressed={option.active}
                    onClick={option.onClick}
                    className={`h-7 rounded-md px-2.5 text-xs font-medium transition-colors ${FOCUS} ${
                        option.active ? 'bg-accent text-white dark:text-neutral-900' : 'text-neutral-600 hover:text-accent'
                    }`}
                >
                    {option.text}
                </button>
            ))}
        </div>
    );
}

/* ---------- A log that said it worked ---------- */

const LOG_COMMAND = 'make_word manuscript.md';

/** A dashed ring that draws itself. framer's pathLength takes over the stroke dashes, so it animates a mask instead. */
function DrawnRing({ show, reduced }: { show: boolean; reduced: boolean }) {
    const maskId = `ring-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
    return (
        <svg viewBox="0 0 120 40" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
            <mask id={maskId} maskUnits="userSpaceOnUse" x="-4" y="-4" width="128" height="48">
                <motion.ellipse
                    cx="60"
                    cy="20"
                    rx="57"
                    ry="18"
                    fill="none"
                    stroke="white"
                    strokeWidth="5"
                    initial={false}
                    animate={{ pathLength: show ? 1 : 0, opacity: show ? 1 : 0 }}
                    transition={ease(reduced, 1.4)}
                />
            </mask>
            <ellipse cx="60" cy="20" rx="57" ry="18" fill="none" stroke={PAPER_ACCENT} strokeWidth="1.5" strokeDasharray="4 3" mask={`url(#${maskId})`} />
        </svg>
    );
}

function LogVisual() {
    const { ref, step, pin, pinned, resume, reduced, visible } = useFoldLoop([2600, 2200, 4500, 1800, 0], 8000);
    const open = step >= 3;
    const marked = step >= 4;

    return (
        <Stage
            loopRef={ref}
            label={
                open
                    ? 'Simulated example. The terminal reports: Done, manuscript.docx written. The opened Word page shows the heading 1. Introduction in the wrong font, circled.'
                    : 'Simulated example. A terminal runs make_word manuscript.md and reports: Done, manuscript.docx written. The file has not been opened yet.'
            }
            controls={
                <>
                    <PlainButton onClick={() => pin(open ? 2 : 4)}>{open ? 'Close the file' : 'Open the file'}</PlainButton>
                    <ReplayButton show={pinned && !reduced} onClick={resume} />
                </>
            }
        >
            <div className="grid h-full grid-cols-2 gap-2">
                <TerminalWindow minHeight={0} className="h-full min-w-0">
                    <div className="-m-2 space-y-1.5 whitespace-pre-wrap break-words text-[11px] leading-snug sm:text-[12px]">
                        <div className="relative">
                            <span className="invisible">$ {LOG_COMMAND}</span>
                            <span className="absolute inset-0">
                                <span className={term.prompt}>$ </span>
                                {step === 0 ? <Typed text={LOG_COMMAND} active={visible} speed={60} /> : LOG_COMMAND}
                            </span>
                        </div>
                        <motion.div initial={false} animate={{ opacity: step >= 1 ? 1 : 0 }} transition={ease(reduced)} className={term.dim}>
                            applying styles…
                        </motion.div>
                        <motion.div initial={false} animate={{ opacity: step >= 2 ? 1 : 0 }} transition={ease(reduced)} className={term.ok}>
                            ✓ Done. manuscript.docx written.
                        </motion.div>
                    </div>
                </TerminalWindow>

                <div className="relative min-w-0 overflow-hidden rounded-xl bg-neutral-100">
                    <motion.div
                        initial={false}
                        animate={{ opacity: open ? 0 : 1 }}
                        transition={ease(reduced)}
                        className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-neutral-600 dark:text-neutral-500"
                    >
                        <FileText className="h-10 w-10" strokeWidth={1.25} aria-hidden="true" />
                        <span className="text-[11px]">manuscript.docx</span>
                    </motion.div>

                    <motion.div
                        initial={false}
                        animate={{ opacity: open ? 1 : 0, y: open ? 0 : 10 }}
                        transition={ease(reduced, 0.8)}
                        className="absolute inset-2 rounded bg-white px-1.5 pt-3 shadow-md ring-1 ring-black/10"
                    >
                        <div className="relative h-10 w-full max-w-[120px]">
                            <span
                                className="absolute inset-0 flex items-center justify-center whitespace-nowrap text-[13px] font-bold text-[#1c1917]"
                                style={{ fontFamily: '"Comic Sans MS", "Comic Sans", cursive' }}
                            >
                                1. Introduction
                            </span>
                            <DrawnRing show={marked} reduced={reduced} />
                        </div>
                        <motion.div
                            initial={false}
                            animate={{ opacity: marked ? 1 : 0 }}
                            transition={ease(reduced)}
                            className="mt-1 w-full max-w-[120px] text-center text-[11px] font-semibold"
                            style={{ color: PAPER_ACCENT }}
                        >
                            Wrong font
                        </motion.div>
                        <div className="mt-2.5 space-y-2 px-1">
                            {['100%', '92%', '97%', '84%', '95%'].map((width) => (
                                <div key={width} className="h-1 rounded-full bg-[#e5e2df]" style={{ width }} />
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </Stage>
    );
}

/* ---------- A sign stored the other way round ---------- */

// Simulated: spending as it should read (positive) against output.
const SPENDING: { x: number; y: number }[] = [
    { x: 1.2, y: 2.6 },
    { x: 1.9, y: 3.6 },
    { x: 2.4, y: 2.9 },
    { x: 3.0, y: 4.4 },
    { x: 3.5, y: 3.4 },
    { x: 4.1, y: 4.9 },
    { x: 4.6, y: 4.0 },
    { x: 5.0, y: 5.6 },
    { x: 5.5, y: 4.7 },
    { x: 6.1, y: 6.2 },
    { x: 6.6, y: 5.3 },
    { x: 7.0, y: 6.8 },
    { x: 7.6, y: 6.1 },
    { x: 8.1, y: 7.6 },
    { x: 8.7, y: 6.9 },
    { x: 9.3, y: 8.0 },
];

const PLOT = { left: 30, right: 312, top: 10, bottom: 136 };
const plotX = (x: number) => PLOT.left + ((x + 10) / 20) * (PLOT.right - PLOT.left);
const plotY = (y: number) => PLOT.bottom - (y / 10) * (PLOT.bottom - PLOT.top);

/** Ordinary least squares line through the points, as end points in chart coordinates. */
function fittedLine(points: { x: number; y: number }[]) {
    const meanX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const meanY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
    const covariance = points.reduce((sum, p) => sum + (p.x - meanX) * (p.y - meanY), 0);
    const variance = points.reduce((sum, p) => sum + (p.x - meanX) ** 2, 0);
    const slope = covariance / variance;
    const intercept = meanY - slope * meanX;
    const xs = points.map((p) => p.x);
    const low = Math.min(...xs);
    const high = Math.max(...xs);
    return { x1: plotX(low), y1: plotY(slope * low + intercept), x2: plotX(high), y2: plotY(slope * high + intercept) };
}

const LINE_CORRECTED = fittedLine(SPENDING);
const LINE_STORED = fittedLine(SPENDING.map((p) => ({ x: -p.x, y: p.y })));

function SignVisual() {
    const { ref, step, pin, pinned, resume, reduced } = useFoldLoop([8500, 0], 8500);
    const corrected = step >= 1;
    const glide = ease(reduced, 1.8);

    return (
        <Stage
            loopRef={ref}
            label={
                corrected
                    ? 'Simulated scatter of capital spending against output. With the sign corrected, spending is positive and the fitted line slopes up: spending raises output.'
                    : 'Simulated scatter of capital spending against output. As stored, spending is negative and the fitted line slopes down, which wrongly suggests spending lowers output.'
            }
            controls={
                <>
                    <Toggle
                        label="Sign of capital spending"
                        options={[
                            { text: 'As stored', active: !corrected, onClick: () => pin(0) },
                            { text: 'Sign corrected', active: corrected, onClick: () => pin(1) },
                        ]}
                    />
                    <ReplayButton show={pinned && !reduced} onClick={resume} />
                </>
            }
        >
            <svg viewBox="0 0 320 176" aria-hidden="true" className="h-[176px] w-full text-neutral-600">
                <line x1={PLOT.left} y1={PLOT.top} x2={PLOT.left} y2={PLOT.bottom} stroke="currentColor" strokeOpacity="0.5" />
                <line x1={PLOT.left} y1={PLOT.bottom} x2={PLOT.right} y2={PLOT.bottom} stroke="currentColor" strokeOpacity="0.5" />
                <line x1={plotX(0)} y1={PLOT.top} x2={plotX(0)} y2={PLOT.bottom} stroke="currentColor" strokeOpacity="0.35" strokeDasharray="3 3" />

                {[
                    { value: -10, text: '−10' },
                    { value: 0, text: '0' },
                    { value: 10, text: '10' },
                ].map((tick) => (
                    <text key={tick.value} x={plotX(tick.value)} y={PLOT.bottom + 13} textAnchor="middle" fontSize="10" fill="currentColor">
                        {tick.text}
                    </text>
                ))}
                <text x={(PLOT.left + PLOT.right) / 2} y={PLOT.bottom + 30} textAnchor="middle" fontSize="11" fill="currentColor">
                    Capital spending
                </text>
                <text transform={`translate(14 ${(PLOT.top + PLOT.bottom) / 2}) rotate(-90)`} textAnchor="middle" fontSize="11" fill="currentColor">
                    Output
                </text>

                {SPENDING.map((point) => (
                    <motion.circle
                        key={point.x}
                        cy={plotY(point.y)}
                        r="3.5"
                        fill="currentColor"
                        fillOpacity="0.65"
                        initial={false}
                        animate={{ cx: plotX(corrected ? point.x : -point.x) }}
                        transition={glide}
                    />
                ))}

                <motion.line
                    strokeWidth="2"
                    strokeLinecap="round"
                    stroke="currentColor"
                    className={`transition-colors duration-1000 ${corrected ? 'text-primary' : 'text-accent'}`}
                    initial={false}
                    animate={corrected ? LINE_CORRECTED : LINE_STORED}
                    transition={glide}
                />

                <motion.text initial={false} animate={{ opacity: corrected ? 0 : 1 }} transition={ease(reduced)} fontSize="12" fontWeight="600" textAnchor="middle" fill="currentColor" className="text-accent">
                    <tspan x={plotX(5)} y="44">
                        Spending lowers
                    </tspan>
                    <tspan x={plotX(5)} y="59">
                        output?
                    </tspan>
                </motion.text>
                <motion.text initial={false} animate={{ opacity: corrected ? 1 : 0 }} transition={ease(reduced)} fontSize="12" fontWeight="600" textAnchor="middle" fill="currentColor" className="text-primary">
                    <tspan x={plotX(-5)} y="44">
                        Spending raises
                    </tspan>
                    <tspan x={plotX(-5)} y="59">
                        output
                    </tspan>
                </motion.text>
            </svg>
            <p className="m-0 text-center text-[11px] leading-5 text-neutral-600 dark:text-neutral-500">Simulated data</p>
        </Stage>
    );
}

/* ---------- Groups merged without warning ---------- */

const MERGE_GROUPS = [
    { id: '12', a: 1, b: 2, dots: 3, x: 30, color: '#d97706' },
    { id: '21', a: 2, b: 1, dots: 2, x: 82, color: '#0d9488' },
    { id: '31', a: 3, b: 1, dots: 3, x: 134, color: '#6366f1' },
    { id: '13', a: 1, b: 3, dots: 2, x: 186, color: '#e11d48' },
    { id: '23', a: 2, b: 3, dots: 3, x: 238, color: '#65a30d' },
    { id: '11', a: 1, b: 1, dots: 2, x: 290, color: '#9333ea' },
];

// Groups whose bad ID (a + b) is the same end up in one cluster, in the first member's colour.
const MERGE_CLUSTERS = [...new Set(MERGE_GROUPS.map((g) => g.a + g.b))].map((sum) => {
    const members = MERGE_GROUPS.filter((g) => g.a + g.b === sum);
    return {
        sum,
        members,
        x: members.reduce((total, g) => total + g.x, 0) / members.length,
        color: members[0].color,
        formula: [...members].sort((p, q) => p.a - q.a).map((g) => `${g.a} + ${g.b}`).join(' and '),
    };
});

const dotPosition = (centre: number, index: number) => ({ cx: centre + ((index % 3) - 1) * 11, cy: 28 + Math.floor(index / 3) * 11 });

// One entry per dot, with where it sits before and after the bad join.
const MERGE_DOTS = MERGE_CLUSTERS.flatMap((cluster) => {
    let used = 0;
    return cluster.members.flatMap((group) => {
        const dots = Array.from({ length: group.dots }, (_, i) => ({
            key: `${group.id}-${i}`,
            before: dotPosition(group.x, i),
            after: dotPosition(cluster.x, used + i),
            colorBefore: group.color,
            colorAfter: cluster.color,
        }));
        used += group.dots;
        return dots;
    });
});

const GROUPS_BEFORE = MERGE_GROUPS.length;
const GROUPS_AFTER = MERGE_CLUSTERS.length;

function MergeVisual() {
    const { ref, step, pin, pinned, resume, reduced } = useFoldLoop([4000, 4500, 3500, 3500, 0], 7000);
    const showFormula = step >= 1;
    const showSums = step >= 2;
    const merged = step >= 3;
    const checked = step >= 4;
    const fade = ease(reduced);

    return (
        <Stage
            loopRef={ref}
            label={
                merged
                    ? `Simulated example. The ID is built as column A plus column B, so 1 + 2 and 2 + 1 both give 3, and 1 + 3 and 3 + 1 both give 4. Groups fall from ${GROUPS_BEFORE} to ${GROUPS_AFTER} and no error is raised. A count check reads: before ${GROUPS_BEFORE}, after ${GROUPS_AFTER}: stop.`
                    : `Simulated example. Dots sit in ${GROUPS_BEFORE} groups, with IDs ${MERGE_GROUPS.map((g) => g.id).join(', ')}.`
            }
            controls={
                <>
                    <Toggle
                        label="Groups before or after the join"
                        options={[
                            { text: 'Before', active: !merged, onClick: () => pin(0) },
                            { text: 'After', active: merged, onClick: () => pin(4) },
                        ]}
                    />
                    <ReplayButton show={pinned && !reduced} onClick={resume} />
                </>
            }
        >
            <div className="flex h-full flex-col justify-between">
                <div className="flex items-center justify-between gap-2">
                    <motion.span initial={false} animate={{ opacity: showFormula ? 1 : 0 }} transition={fade} className="font-mono text-[11px] text-neutral-700">
                        ID = column A + column B
                    </motion.span>
                    <span className={`flex-shrink-0 text-sm font-semibold tabular-nums transition-colors duration-700 ${merged ? 'text-accent' : 'text-primary'}`}>
                        Groups: {merged ? GROUPS_AFTER : GROUPS_BEFORE}
                    </span>
                </div>

                <svg viewBox="0 0 320 92" aria-hidden="true" className="h-[100px] w-full text-neutral-700">
                    {MERGE_DOTS.map((dot) => (
                        <motion.circle
                            key={dot.key}
                            r="4"
                            initial={false}
                            animate={merged ? { ...dot.after, fill: dot.colorAfter } : { ...dot.before, fill: dot.colorBefore }}
                            transition={ease(reduced, 1.6)}
                        />
                    ))}

                    <motion.g initial={false} animate={{ opacity: merged ? 0 : 1 }} transition={fade} fill="currentColor" textAnchor="middle">
                        {MERGE_GROUPS.map((group) => (
                            <g key={group.id}>
                                <text x={group.x} y="12" fontSize="11" fontWeight="600">
                                    ID {group.id}
                                </text>
                                <motion.text initial={false} animate={{ opacity: showFormula ? 1 : 0 }} transition={fade} x={group.x} y="66" fontSize="10" className="font-mono">
                                    {group.a} + {group.b}
                                </motion.text>
                                <motion.text initial={false} animate={{ opacity: showSums ? 1 : 0 }} transition={fade} x={group.x} y="82" fontSize="11" fontWeight="600" className="font-mono">
                                    = {group.a + group.b}
                                </motion.text>
                            </g>
                        ))}
                    </motion.g>

                    <motion.g initial={false} animate={{ opacity: merged ? 1 : 0 }} transition={fade} fill="currentColor" textAnchor="middle">
                        {MERGE_CLUSTERS.map((cluster) => (
                            <g key={cluster.sum}>
                                <text x={cluster.x} y="12" fontSize="11" fontWeight="600">
                                    ID {cluster.sum}
                                </text>
                                <text x={cluster.x} y="66" fontSize="9.5" className="font-mono">
                                    {cluster.formula}
                                </text>
                                <text x={cluster.x} y="82" fontSize="11" fontWeight="600" className="font-mono">
                                    = {cluster.sum}
                                </text>
                            </g>
                        ))}
                    </motion.g>
                </svg>

                <div className="flex min-h-7 items-center justify-between gap-2">
                    <motion.span initial={false} animate={{ opacity: merged ? 1 : 0 }} transition={fade} className="text-xs font-medium text-primary">
                        No error raised
                    </motion.span>
                    <motion.span
                        initial={false}
                        animate={{ opacity: checked ? 1 : 0, y: checked ? 0 : 4 }}
                        transition={fade}
                        className="rounded-md border border-accent px-2 py-0.5 font-mono text-[11px] text-accent"
                    >
                        before {GROUPS_BEFORE}, after {GROUPS_AFTER}: stop
                    </motion.span>
                </div>
            </div>
        </Stage>
    );
}

/* ---------- A helper that kept running ---------- */

const CPU_READINGS = [94, 91, 96, 89, 97, 93, 90, 95];
const CPU_AFTER_STOP = 4;
const TICK_MS = 500;
const RUN_MS = 8000; // the clock and file count reach their last values just before the check
const CLOCK_FROM = 42;
const CLOCK_TO = 178;
const FILES_FROM = 3120;
const FILES_TO = 12408;

const formatClock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

function ProcessVisual() {
    const { ref, step, pin, resume, reduced, visible } = useFoldLoop([9500, 4500, 0], 8000);
    const running = step < 2;
    const [progress, setProgress] = useState(0);
    const [tick, setTick] = useState(0);
    const [wasRunning, setWasRunning] = useState(running);

    // A new run starts its clock from the beginning, without showing the old value first.
    if (running !== wasRunning) {
        setWasRunning(running);
        if (running) setProgress(0);
    }

    useEffect(() => {
        if (!running || !visible || reduced) return;
        const timer = setInterval(() => {
            setTick((t) => t + 1);
            setProgress((p) => Math.min(1, p + TICK_MS / RUN_MS));
        }, TICK_MS);
        return () => clearInterval(timer);
    }, [running, visible, reduced]);

    const done = reduced ? 1 : progress;
    const clock = formatClock(Math.round(CLOCK_FROM + done * (CLOCK_TO - CLOCK_FROM)));
    const files = Math.round(FILES_FROM + done * (FILES_TO - FILES_FROM)).toLocaleString('en-US');
    const cpu = running ? CPU_READINGS[tick % CPU_READINGS.length] : CPU_AFTER_STOP;
    const checked = step >= 1;
    const stopped = step >= 2;

    const press = () => {
        if (step === 0) pin(1);
        else if (step === 1) pin(2);
        else if (reduced) pin(0);
        else resume();
    };
    const pressLabel = step === 0 ? 'Check for leftover processes' : step === 1 ? 'Stop the process' : 'Run again';

    return (
        <Stage
            loopRef={ref}
            label={
                stopped
                    ? 'Illustrative example. The task list says the file search helper has finished. A check finds the search process still running at 94 percent CPU. Once it is stopped, the CPU meter falls to a low level and the download stops.'
                    : 'Illustrative example. The task list says the file search helper has finished, yet the CPU meter stays high, the elapsed time keeps running, and a cloud service is downloading 12,408 files.'
            }
            controls={<PlainButton onClick={press}>{pressLabel}</PlainButton>}
        >
            <div className="flex h-full flex-col gap-1.5 text-xs">
                <div className="grid grid-cols-2 gap-1.5">
                    <div className="flex min-w-0 items-start gap-1.5 rounded-lg border border-neutral-200 p-2.5 leading-snug text-primary">
                        <CheckCircle2 className="mt-px h-3.5 w-3.5 flex-shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                        <span className="min-w-0">File search helper: Finished</span>
                    </div>
                    <div className="min-w-0 rounded-lg border border-neutral-200 p-2.5">
                        <div className="flex items-center justify-between gap-1 tabular-nums text-primary">
                            <span className="inline-flex items-center gap-1">
                                <Cpu className="h-3.5 w-3.5" aria-hidden="true" />
                                CPU
                            </span>
                            <span className={`font-semibold ${stopped ? '' : 'text-accent'}`}>{cpu}%</span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-neutral-200">
                            <motion.div
                                initial={false}
                                animate={{ width: `${cpu}%` }}
                                transition={stopped ? ease(reduced, 1.8) : { duration: reduced ? 0 : TICK_MS / 1000, ease: 'linear' }}
                                className={`h-full rounded-full transition-colors duration-1000 ${stopped ? 'bg-neutral-500' : 'bg-accent'}`}
                            />
                        </div>
                        <div className="mt-1.5 flex items-center justify-between gap-1 tabular-nums text-primary">
                            <span className="inline-flex items-center gap-1">
                                <Timer className="h-3.5 w-3.5" aria-hidden="true" />
                                Time
                            </span>
                            <span>{clock}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 rounded-lg border border-neutral-200 px-2.5 py-2 text-primary">
                    <Cloud className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                    <span className="min-w-0 tabular-nums">{stopped ? 'Download stopped' : `Downloading ${files} files…`}</span>
                </div>

                <motion.div
                    initial={false}
                    animate={{ opacity: checked ? 1 : 0 }}
                    transition={ease(reduced)}
                    className={`whitespace-pre-wrap break-words rounded-lg border px-2.5 py-2 font-mono transition-colors duration-700 ${
                        stopped ? 'border-neutral-300 text-primary' : 'border-accent bg-accent/10 font-semibold text-accent'
                    }`}
                >
                    {stopped ? 'search  stopped' : 'search  CPU 94%'}
                </motion.div>

                <p className="m-0 mt-auto text-center text-[11px] leading-4 text-neutral-600 dark:text-neutral-500">Illustrative numbers</p>
            </div>
        </Stage>
    );
}

/* ---------- The section ---------- */

const VISUALS: Record<string, () => React.ReactNode> = {
    log: LogVisual,
    sign: SignVisual,
    merge: MergeVisual,
    process: ProcessVisual,
};

function ErrorCard({ fold, fixLabel }: { fold: GuideFoldItem; fixLabel: string }) {
    const Visual = fold.demo ? VISUALS[fold.demo] : undefined;
    return (
        <article className="card-bg flex min-w-0 flex-col rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800 sm:p-5">
            {Visual && <Visual />}
            <h3 className="mt-5 font-serif text-lg font-semibold text-primary">{fold.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-500">{fold.body}</p>
            <p className="mt-auto pt-3 text-sm leading-relaxed text-primary">
                <span className="font-bold text-accent">{fixLabel}:</span> {fold.fix}
            </p>
        </article>
    );
}

export default function SilentErrors({ folds, fixLabel = 'Check' }: FoldDemoProps) {
    return (
        <div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {folds.map((fold) => (
                    <ErrorCard key={fold.title} fold={fold} fixLabel={fixLabel} />
                ))}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-neutral-600 dark:text-neutral-500">Simulated examples of real mistakes.</p>
        </div>
    );
}
