'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, TriangleAlert } from 'lucide-react';
import { DemoFrame, TerminalWindow, Typed, term, useReducedMotion, useStepLoop } from './primitives';
import { FoldDemoProps } from './demoProps';

const ease = [0.22, 1, 0.36, 1] as const;

const REBUILT = 'Rebuilt from a recording of the real interface, version 2.1.231. Newer versions differ in places. The wording of the example is mine.';
const ILLUSTRATION = 'An illustration that combines /doctor with /doctor prompt-audit, which looks for conflicting rules. The wording is mine, and yours will differ.';

const PROMPT = 'read clean.py and add a check for duplicate hotel_id';
const STATUS_BUSY = '⏵⏵ accept edits on · esc to interrupt · ← for agents';
const STATUS_IDLE = '⏸ manual mode on · ? for shortcuts · ← for agents';
const WARN = '⚠︎';

/** Taller on phones, where long lines wrap. Large enough for the tallest screen of any demo, so switching tabs does not jump. */
const bodyHeight = 'min-h-[405px] sm:min-h-[340px]';

/** Grows a line into the terminal gently. Everything below it slides down, as in a real terminal. */
function Reveal({ show, className = '', children }: { show: boolean; className?: string; children: React.ReactNode }) {
    const reduced = useReducedMotion();
    return (
        <motion.div
            initial={false}
            animate={{ height: show ? 'auto' : 0, opacity: show ? 1 : 0 }}
            transition={{ duration: reduced ? 0 : 0.45, ease }}
            className={`overflow-hidden ${className}`}
        >
            {children}
        </motion.div>
    );
}

/** One full screen of the terminal. Screens share a grid cell, so the tallest one sets the height. */
function Screen({ show, children }: { show: boolean; children: React.ReactNode }) {
    return (
        <div className={`min-w-0 [grid-area:1/1] transition-opacity duration-500 motion-reduce:transition-none ${show ? 'opacity-100' : 'invisible opacity-0'}`}>
            {children}
        </div>
    );
}

/** A line with a marker in a fixed gutter, so wrapped text stays aligned. */
function Row({ mark, markClass = '', className = '', children }: { mark?: string; markClass?: string; className?: string; children: React.ReactNode }) {
    return (
        <div className={`flex ${className}`}>
            <span aria-hidden="true" className={`w-[2ch] flex-shrink-0 ${markClass}`}>
                {mark}
            </span>
            <span className="min-w-0 flex-1">{children}</span>
        </div>
    );
}

function InputBox({ status, children }: { status: string; children?: React.ReactNode }) {
    return (
        <div className="mt-3">
            <div className="border-y border-white/20 py-1">
                <Row mark="❯" markClass={term.prompt}>
                    {children}
                    {' '}
                </Row>
            </div>
            <p className={`mt-1 pl-[2ch] ${term.dim}`}>{status}</p>
        </div>
    );
}

const SPINNER = ['✶', '✻', '✽', '✢', '·', '✳'];

function Spinner({ active }: { active: boolean }) {
    const reduced = useReducedMotion();
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (!active || reduced) return;
        const timer = setInterval(() => setIndex((i) => (i + 1) % SPINNER.length), 280);
        return () => clearInterval(timer);
    }, [active, reduced]);

    return (
        <span aria-hidden="true" className={`inline-block w-[2ch] ${term.prompt}`}>
            {SPINNER[index]}
        </span>
    );
}

function OptionList({ options, selected, pressed = false, gutter = {} }: { options: string[]; selected: number; pressed?: boolean; gutter?: Record<number, string> }) {
    return (
        <div>
            {options.map((option, index) => {
                const current = index === selected;
                return (
                    <Row
                        key={option}
                        mark={current ? '❯' : gutter[index]}
                        markClass={current ? term.prompt : term.dim}
                        className={`rounded-sm transition-colors duration-300 motion-reduce:transition-none ${current ? 'text-white' : 'text-white/70'} ${current && pressed ? 'bg-white/15' : ''}`}
                    >
                        {option}
                    </Row>
                );
            })}
        </div>
    );
}

const keycapBase = 'inline-flex h-6 min-w-6 items-center justify-center rounded-md border px-1.5 font-mono text-[11px] leading-none';
const keycapIdle = 'border-neutral-300 bg-neutral-100 text-neutral-700';

/** A key press shown under the terminal. It is not part of the interface being rebuilt, so it stays outside the window. */
function Keycap({ label, show = true, pressed = false, delay = 0 }: { label: string; show?: boolean; pressed?: boolean; delay?: number }) {
    return (
        <kbd
            style={{ transitionDelay: `${delay}ms` }}
            className={`${keycapBase} transition-[opacity,background-color,border-color,color] duration-300 motion-reduce:transition-none ${show ? 'opacity-100' : 'opacity-0'} ${
                pressed ? 'border-accent bg-accent/10 text-accent' : keycapIdle
            }`}
        >
            {label}
        </kbd>
    );
}

/** The terminal, the row of key presses under it, and the caption. `label` describes an animation that is not interactive. */
function Demo({
    frameRef,
    label,
    caption,
    onReplay,
    keys,
    children,
}: {
    frameRef: React.Ref<HTMLDivElement>;
    label?: string;
    caption: string;
    onReplay: () => void;
    keys?: React.ReactNode;
    children: React.ReactNode;
}) {
    const reduced = useReducedMotion();
    return (
        <DemoFrame frameRef={frameRef} caption={caption} onReplay={reduced ? undefined : onReplay}>
            <div {...(label ? { role: 'img', 'aria-label': label } : {})}>
                <TerminalWindow title="~/demo" minHeight={0}>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: reduced ? 0 : 0.4 }}
                        className={`${bodyHeight} whitespace-pre-wrap break-words`}
                    >
                        {children}
                    </motion.div>
                </TerminalWindow>
                <div className="mt-2 flex min-h-7 flex-wrap items-center gap-1.5">{keys}</div>
            </div>
        </DemoFrame>
    );
}

function BtwDemo() {
    // 0 task starts, 1 reading, 2 reader types, 3 box opens, 4 answer, 5 main task edits behind the box, 6 Esc, 7 closed
    const { ref, step, replay } = useStepLoop([1600, 3000, 3200, 2000, 4000, 4200, 1400, 0], { hold: 5000, reducedStep: 5 });
    const open = step >= 3 && step <= 6;

    return (
        <Demo
            frameRef={ref}
            caption={REBUILT}
            onReplay={replay}
            label="Animation. A task is running on clean.py. The reader types /btw which file are you reading? A small box opens and answers: clean.py. I opened it to see how rows are loaded before adding the check. While the box is open, the main task continues and adds five lines to clean.py. Pressing Esc closes the box, and the question is not added to the conversation."
            keys={
                <>
                    <Keycap label="Esc" show={step >= 6} pressed={step === 6} />
                    <span
                        className={`rounded-full border border-accent/40 bg-accent/5 px-2.5 py-0.5 text-xs font-medium text-accent transition-opacity duration-500 motion-reduce:transition-none ${
                            step === 7 ? 'opacity-100' : 'opacity-0'
                        }`}
                    >
                        Not added to the conversation
                    </span>
                </>
            }
        >
            <Row mark="❯" markClass={term.prompt}>
                {PROMPT}
            </Row>

            <Reveal show={step >= 1}>
                <Row mark="⏺" className="mt-3">
                    {"I'll read clean.py first."}
                </Row>
                <Row mark="⏺" markClass={term.ok} className="mt-1">
                    {step >= 5 ? 'Read 1 file' : 'Reading 1 file…'}
                </Row>
                <Row mark="⎿" markClass={term.dim} className={`pl-[2ch] ${term.dim}`}>
                    {' clean.py'}
                </Row>
            </Reveal>

            <Reveal show={step >= 5}>
                <Row
                    mark="⏺"
                    markClass={term.ok}
                    className={`mt-1 rounded-sm transition-colors duration-700 motion-reduce:transition-none ${step === 5 ? 'bg-white/10' : ''}`}
                >
                    Update(clean.py) <span className={term.ok}>+5</span>
                </Row>
            </Reveal>

            <Reveal show={open}>
                <div className={`${term.box} mt-3 px-3 py-2`}>
                    <p className="text-white/70">/btw which file are you reading?</p>
                    <Reveal show={step <= 3}>
                        <p className="mt-1">
                            <Spinner active={step === 3} />
                            Answering…
                        </p>
                        <p className={`mt-1 ${term.dim}`}>Esc to close</p>
                    </Reveal>
                    <Reveal show={step >= 4}>
                        <p className="mt-1">clean.py. I opened it to see how rows are loaded before adding the check.</p>
                        <p className={`mt-1 ${term.dim}`}>↑/↓ to scroll · c to copy · f to fork · Esc to close</p>
                    </Reveal>
                </div>
            </Reveal>

            <InputBox status={STATUS_BUSY}>{step === 2 && <Typed text="/btw which file are you reading?" speed={55} />}</InputBox>
        </Demo>
    );
}

function CheckLine({ show, label, mark, markClass, result }: { show: boolean; label: string; mark: string; markClass: string; result: string }) {
    return (
        <Reveal show={show}>
            <p className="mt-1">
                {label}{' '}
                <span className={markClass}>
                    {mark} {result}
                </span>
            </p>
        </Reveal>
    );
}

function DoctorDemo() {
    // 0 types, 1 to 3 checks, 4 conflict, 5 options, 6 selection moves up, 7 presses Enter on option 1
    const { ref, step, replay } = useStepLoop([2200, 2200, 2600, 2800, 4000, 3400, 2200, 0], { hold: 5000 });

    return (
        <Demo
            frameRef={ref}
            caption={ILLUSTRATION}
            onReplay={replay}
            label="Illustration. The reader types /doctor. A checklist reports no issues with the installation, two unused extensions taking up context, and two rules that contradict each other: the global rules say reply in English, the project rules say reply in Chinese. Nothing is changed until you confirm. The reader chooses to review them one at a time."
            keys={
                <>
                    <Keycap label="↑" show={step >= 6} pressed={step === 6} />
                    <Keycap label="Enter" show={step >= 7} pressed={step === 7} />
                </>
            }
        >
            <Reveal show={step === 0}>
                <InputBox status={STATUS_IDLE}>
                    <Typed text="/doctor" active={step === 0} speed={110} />
                </InputBox>
            </Reveal>

            <Reveal show={step >= 1}>
                <Row mark="❯" markClass={term.prompt} className="mb-2">
                    /doctor
                </Row>
            </Reveal>

            <CheckLine show={step >= 1} label="Checking installation…" mark="✓" markClass={term.ok} result="no issues" />
            <CheckLine show={step >= 2} label="Checking extensions…" mark={WARN} markClass={term.warn} result="2 unused, taking up context" />
            <CheckLine show={step >= 3} label="Checking rules files…" mark={WARN} markClass={term.warn} result="2 rules contradict each other" />

            <Reveal show={step >= 4}>
                <div className={`${term.box} mt-3 grid grid-cols-2 divide-x divide-white/15`}>
                    <div className="min-w-0 px-3 py-2">
                        <p className={term.dim}>Global rules:</p>
                        <p>Use British spelling.</p>
                    </div>
                    <div className="min-w-0 px-3 py-2">
                        <p className={term.dim}>Project rules:</p>
                        <p>Use American spelling.</p>
                    </div>
                </div>
            </Reveal>

            <Reveal show={step >= 5}>
                <p className="mt-3">Nothing is changed until you confirm.</p>
                <div className="mt-2">
                    <OptionList options={['1. Review them one at a time', '2. Skip for now']} selected={step >= 6 ? 0 : 1} pressed={step === 7} />
                </div>
            </Reveal>
        </Demo>
    );
}

const LEVELS = [
    { name: 'low', start: 0, marker: 1, research: 'Brainstorming questions and reformatting tables.', web: 'Copy changes and small fixes.' },
    { name: 'medium', start: 8, marker: 10, research: 'Drafting a section from my outline.', web: 'A feature built to a clear spec.' },
    { name: 'high', start: 19, marker: 20, research: 'Tracing why two runs of a model disagree.', web: 'Debugging and code review.' },
    { name: 'xhigh', start: 28, marker: 30, research: 'The audit that traces every number to code.', web: 'Anything that touches keys or user data.' },
    { name: 'max', start: 39, marker: 40, research: 'A hard problem that lower levels failed on.', web: 'A security review.' },
];
const MAX_WARNING = 'May use excessive tokens resulting in long response times or overthinking. Use sparingly for the hardest tasks.';

function EffortDemo() {
    // Moves low, medium, high once, then rests. With reduced motion it starts on high.
    const { ref, step, replay } = useStepLoop([3800, 3800, 0], { loop: false });
    const [chosen, setChosen] = useState<number | null>(null);
    const radios = useRef<(HTMLButtonElement | null)[]>([]);
    const active = chosen ?? step;
    const level = LEVELS[active];

    const choose = (index: number, moveFocus = false) => {
        const next = Math.max(0, Math.min(LEVELS.length - 1, index));
        setChosen(next);
        if (moveFocus) radios.current[next]?.focus();
    };
    const stopAuto = () => setChosen((c) => c ?? active);

    const onKeyDown = (event: React.KeyboardEvent) => {
        const targets: Record<string, number> = {
            ArrowLeft: active - 1,
            ArrowUp: active - 1,
            ArrowRight: active + 1,
            ArrowDown: active + 1,
            Home: 0,
            End: LEVELS.length - 1,
        };
        if (!(event.key in targets)) return;
        event.preventDefault();
        choose(targets[event.key], true);
    };

    const keyButton = `${keycapBase} ${keycapIdle} h-7 min-w-7 cursor-pointer text-[13px] transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`;

    return (
        <Demo
            frameRef={ref}
            caption="The slider is rebuilt from a recording of the real interface, version 2.1.231. The research and web coding examples under it are mine."
            onReplay={() => {
                setChosen(null);
                replay();
            }}
            keys={
                <>
                    <button type="button" aria-label="Lower effort" onFocus={stopAuto} onClick={() => choose(active - 1)} className={keyButton}>
                        ←
                    </button>
                    <button type="button" aria-label="Higher effort" onFocus={stopAuto} onClick={() => choose(active + 1)} className={keyButton}>
                        →
                    </button>
                </>
            }
        >
            <Row mark="❯" markClass={term.prompt}>
                /effort
            </Row>
            <div className="mt-2 border-t border-white/20 pt-2">
                <p className="font-semibold text-white">Effort</p>

                <div className="mx-auto mt-2 w-[42ch] max-w-full whitespace-pre max-[359px]:text-[10.5px]">
                    <div className={`flex justify-between ${term.dim}`}>
                        <span>Faster</span>
                        <span>Smarter</span>
                    </div>
                    <div className="relative h-[1.5em]" aria-hidden="true">
                        <span className="absolute inset-x-0 top-1/2 border-t border-white/35" />
                        <span
                            style={{ left: `${level.marker}ch` }}
                            className={`absolute top-0 w-[1ch] bg-[#1c1917] text-center leading-[1.5em] transition-[left] duration-500 ease-out motion-reduce:transition-none ${term.prompt}`}
                        >
                            ▲
                        </span>
                    </div>
                    <div role="radiogroup" aria-label="Effort level" onKeyDown={onKeyDown} onFocus={stopAuto} className="relative h-7">
                        {LEVELS.map((item, index) => {
                            const selected = index === active;
                            return (
                                <button
                                    key={item.name}
                                    ref={(node) => {
                                        radios.current[index] = node;
                                    }}
                                    type="button"
                                    role="radio"
                                    aria-checked={selected}
                                    tabIndex={selected ? 0 : -1}
                                    onClick={() => choose(index)}
                                    style={{ left: `calc(${item.start}ch - 4px)` }}
                                    className={`absolute top-0 h-7 cursor-pointer rounded px-1 transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-[#f4a9b3] motion-reduce:transition-none ${
                                        selected ? `bg-white/15 font-semibold ${term.prompt}` : 'bg-white/[0.06] text-white/75 hover:bg-white/15 hover:text-white'
                                    }`}
                                >
                                    {item.name}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <Reveal show={level.name === 'max'}>
                    <p className={`mt-2 ${term.warn}`}>{MAX_WARNING}</p>
                </Reveal>

                <p className={`mt-2 ${term.dim}`}>←/→ to adjust · Enter to confirm · Esc to cancel</p>
            </div>

            <div className="mt-3 grid grid-cols-1 border-t border-white/20 pt-3">
                {LEVELS.map((item, index) => (
                    <Screen key={item.name} show={index === active}>
                        <p>
                            <span className={`block sm:inline ${term.dim}`}>In research </span>
                            {item.research}
                        </p>
                        <p className="mt-1">
                            <span className={`block sm:inline ${term.dim}`}>In web coding </span>
                            {item.web}
                        </p>
                    </Screen>
                ))}
            </div>

            <p className="sr-only" aria-live="polite">
                {chosen !== null && `${level.name}. In research: ${level.research} In web coding: ${level.web}${level.name === 'max' ? ` ${MAX_WARNING}` : ''}`}
            </p>
        </Demo>
    );
}

function RewindDemo() {
    // 0 conversation, 1 Esc Esc, 2 picker on (current), 3 picker on the message, 4 confirm on option 2, 5 confirm on option 1, 6 Enter, 7 cleared
    const { ref, step, replay } = useStepLoop([2400, 2000, 2000, 3400, 3600, 5000, 1200, 0], { hold: 4500, reducedStep: 5 });
    const picking = step === 2 || step === 3;
    const both = step >= 4;

    return (
        <Demo
            frameRef={ref}
            caption="Rebuilt from a recording of the real interface, version 2.1.231, with the confirmation text updated to version 2.1.317. The wording of the example is mine."
            onReplay={replay}
            label="Animation. The conversation holds one message and an edit that added five lines to clean.py. The reader presses Esc twice. The Rewind picker lists the message. The next screen opens on Restore code and conversation, and says that the message and everything after it will be removed and that the code will be restored. The reader presses Enter. The screen clears and the old message is back in the input box."
            keys={
                <>
                    <Keycap label="Esc" show={step >= 1} pressed={step === 1} />
                    <Keycap label="Esc" show={step >= 1} pressed={step === 1} delay={500} />
                    <Keycap label="↑" show={step >= 3} pressed={step === 3} />
                    <Keycap label="Enter" show={step >= 4} pressed={step === 4 || step === 6} />
                </>
            }
        >
            <div className="grid grid-cols-1">
                <Screen show={step <= 3}>
                    <Row mark="❯" markClass={term.prompt}>
                        {PROMPT}
                    </Row>
                    <Row mark="⏺" markClass={term.ok} className="mt-3">
                        clean.py <span className={term.ok}>+5</span>
                    </Row>

                    <Reveal show={!picking}>
                        <InputBox status={STATUS_IDLE} />
                    </Reveal>

                    <Reveal show={picking}>
                        <div className="mt-3 border-t border-white/20 pt-2">
                            <p className="font-semibold text-white">Rewind</p>
                            <p className="mt-2">Restore the code and/or conversation to the point before…</p>
                            <div className="mt-2">
                                <Row mark={step === 3 ? '❯' : undefined} markClass={term.prompt} className={step === 3 ? 'text-white' : 'text-white/70'}>
                                    {PROMPT}
                                </Row>
                                <Row className={term.dim}>clean.py +5</Row>
                                <Row mark={step === 2 ? '❯' : undefined} markClass={term.prompt} className={`mt-2 ${step === 2 ? 'text-white' : 'text-white/70'}`}>
                                    (current)
                                </Row>
                            </div>
                            <p className={`mt-3 ${term.dim}`}>Enter to continue · Esc to cancel</p>
                        </div>
                    </Reveal>
                </Screen>

                <Screen show={step >= 4 && step <= 6}>
                    <div>
                        <p className="font-semibold text-white">Rewind</p>
                        <p className="mt-2">Confirm you want to restore to the point before you sent this message:</p>
                        <div className="mt-2 border-l-2 border-white/30 pl-[1ch]">
                            <p>{PROMPT}</p>
                            <p className={term.dim}>(33s ago)</p>
                        </div>
                        <div className="mt-2">
                            <p>This message and everything after it will be removed.</p>
                            <p>{both ? 'The code will be restored -5 in clean.py.' : 'The code will be unchanged.'}</p>
                        </div>
                        <div className="mt-2">
                            <OptionList
                                options={['1. Restore code and conversation', '2. Restore conversation', '3. Restore code', '4. Summarize from here', '5. Summarize up to here']}
                                selected={both ? 0 : 1}
                                pressed={step === 6}
                                gutter={{ 4: '↓' }}
                            />
                        </div>
                        
                    </div>
                </Screen>

                <Screen show={step === 7}>
                    <InputBox status="⏸ manual mode on">{PROMPT}</InputBox>
                </Screen>
            </div>
        </Demo>
    );
}

const DEMOS: Record<string, () => React.ReactElement> = {
    btw: BtwDemo,
    doctor: DoctorDemo,
    effort: EffortDemo,
    rewind: RewindDemo,
};

export default function CommandLab({ folds, fixLabel }: FoldDemoProps) {
    const items = folds.filter((fold) => fold.demo && DEMOS[fold.demo]);
    const [active, setActive] = useState(0);
    const tabs = useRef<(HTMLButtonElement | null)[]>([]);
    const reduced = useReducedMotion();

    if (!items.length) return null;
    const current = items[Math.min(active, items.length - 1)];
    const ActiveDemo = DEMOS[current.demo as string];

    const onKeyDown = (event: React.KeyboardEvent) => {
        const last = items.length - 1;
        const targets: Record<string, number> = {
            ArrowLeft: active === 0 ? last : active - 1,
            ArrowRight: active === last ? 0 : active + 1,
            Home: 0,
            End: last,
        };
        if (!(event.key in targets)) return;
        event.preventDefault();
        setActive(targets[event.key]);
        tabs.current[targets[event.key]]?.focus();
    };

    return (
        <div>
            <div role="tablist" aria-label="Commands" onKeyDown={onKeyDown} className="flex w-full rounded-full bg-neutral-100 p-1 sm:inline-flex sm:w-auto dark:bg-neutral-800">
                {items.map((fold, index) => {
                    const selected = index === active;
                    return (
                        <button
                            key={fold.demo}
                            ref={(node) => {
                                tabs.current[index] = node;
                            }}
                            type="button"
                            role="tab"
                            id={`command-tab-${fold.demo}`}
                            aria-selected={selected}
                            aria-controls={selected ? `command-panel-${fold.demo}` : undefined}
                            tabIndex={selected ? 0 : -1}
                            onClick={() => setActive(index)}
                            className={`relative min-w-0 flex-1 rounded-full px-1.5 py-1.5 font-mono text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:flex-none sm:px-5 sm:text-sm ${
                                selected ? 'text-white dark:text-neutral-50' : 'text-neutral-600 hover:text-primary dark:text-neutral-500'
                            }`}
                        >
                            {selected && (
                                <motion.span
                                    layoutId="command-lab-pill"
                                    className="absolute inset-0 rounded-full bg-accent shadow-sm"
                                    transition={reduced ? { duration: 0 } : { duration: 0.35, ease }}
                                />
                            )}
                            <span className="relative">{fold.title}</span>
                        </button>
                    );
                })}
            </div>

            <div
                role="tabpanel"
                id={`command-panel-${current.demo}`}
                aria-labelledby={`command-tab-${current.demo}`}
                className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-8"
            >
                <div className="min-w-0">
                    <ActiveDemo key={current.demo} />
                </div>

                {/* All four texts share a grid cell, so the tallest sets the height and the page below stays still. */}
                <div className="grid min-w-0 grid-cols-1">
                    {items.map((fold) => (
                        <Screen key={fold.demo} show={fold === current}>
                            {fixLabel && <p className="text-xs font-semibold uppercase tracking-wider text-accent">{fixLabel}</p>}
                            <p className="mt-1.5 font-serif text-xl leading-snug text-primary">{fold.fix}</p>
                            <p className="mt-3 text-[15px] leading-relaxed text-neutral-700 dark:text-neutral-600">{fold.body}</p>
                            {fold.caution && (
                                <p className="mt-4 flex gap-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-500">
                                    <TriangleAlert className="mt-[0.2em] h-4 w-4 flex-shrink-0 text-accent" aria-hidden="true" />
                                    <span>{fold.caution}</span>
                                </p>
                            )}
                            {fold.more_href && (
                                <a
                                    href={fold.more_href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-4 inline-flex items-center gap-1 rounded-sm text-sm font-medium text-accent underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                                >
                                    {fold.more_label}
                                    <ArrowUpRight className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                                    <span className="sr-only"> (opens in a new tab)</span>
                                </a>
                            )}
                        </Screen>
                    ))}
                </div>
            </div>
        </div>
    );
}
