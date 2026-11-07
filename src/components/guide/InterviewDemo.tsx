'use client';

import { motion } from 'framer-motion';
import { DemoFrame, TerminalWindow, Typed, term, useReducedMotion, useStepLoop } from '@/components/guide/primitives';

const PROMPT = "Don't write anything yet. First ask me the questions you need answered before adding a duplicate check to clean.py.";
const CLOSING = "Thanks. I'll write this into SPEC.md before touching the code.";
const REVIEWED = 'Reviewed by me before any code is written.';

const TURNS = [
    {
        question: 'Should a duplicate be the same hotel and month, or the same hotel only?',
        answer: 'Same hotel and month.',
        spec: 'A duplicate is the same hotel and month.',
    },
    {
        question: 'Keep the first row, or stop with an error?',
        answer: 'Stop with an error. I want to see them.',
        spec: 'Duplicates stop the script with an error.',
    },
    {
        question: 'Should the check run on the raw file or after cleaning?',
        answer: 'On the raw file.',
        spec: 'The check runs on the raw file.',
    },
];

// Steps: 0 empty prompt, 1 prompt typed, then a question and an answer for each turn, then the closing line, then the review note.
// With the final hold, one loop lasts 25 seconds.
const DURATIONS = [500, 3600, 2800, 2400, 2000, 2800, 2400, 2400, 2200, 0];
const FINAL_HOLD = 3900;
const PROMPT_STEP = 1;
const CLOSING_STEP = 8;
const REVIEWED_STEP = 9;
const questionStep = (turn: number) => 2 + turn * 2;
const answerStep = (turn: number) => 3 + turn * 2;

const PROMPT_SPEED = 20;
const ANSWER_SPEED = 24;
/** The spec line lands just after its answer has finished typing, in seconds. */
const specDelay = (answer: string) => (answer.length * ANSWER_SPEED) / 1000 + 0.2;

/** Fades content in place. The content always takes up its space, so nothing moves between steps. */
function Fade({ show, delay = 0, className, children }: { show: boolean; delay?: number; className?: string; children: React.ReactNode }) {
    const reduced = useReducedMotion();
    return (
        <motion.div
            initial={false}
            animate={{ opacity: show ? 1 : 0, y: show ? 0 : 4 }}
            transition={reduced ? { duration: 0 } : { duration: show ? 0.5 : 0.3, delay: show ? delay : 0, ease: 'easeOut' }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

function TerminalLine({ marker, markerClass, children }: { marker: string; markerClass: string; children: React.ReactNode }) {
    return (
        <div className="flex gap-2">
            <span className={`flex-shrink-0 ${markerClass}`}>{marker}</span>
            <div className="min-w-0 flex-1 whitespace-pre-wrap break-words">{children}</div>
        </div>
    );
}

/** Typed text over an invisible copy of itself, which holds the final height while it types. */
function TypedLine({ text, active, speed, caret, className = '' }: { text: string; active: boolean; speed: number; caret?: boolean; className?: string }) {
    return (
        <span className={`relative block ${className}`}>
            <span className="invisible">{text}</span>
            <span className="absolute inset-0">
                <Typed text={text} active={active} speed={speed} caret={caret} />
            </span>
        </span>
    );
}

/** A small ring whose tick draws itself when the spec line lands. */
function Tick({ show, delay }: { show: boolean; delay: number }) {
    const reduced = useReducedMotion();
    return (
        <svg viewBox="0 0 16 16" className="mt-1 h-4 w-4 flex-shrink-0" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7" strokeWidth="1" className="stroke-neutral-300" />
            <motion.path
                d="M4.75 8.25 7.1 10.6 11.5 5.75"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="stroke-accent"
                initial={false}
                animate={{ pathLength: show ? 1 : 0, opacity: show ? 1 : 0 }}
                transition={reduced ? { duration: 0 } : { duration: show ? 0.6 : 0.3, delay: show ? delay : 0, ease: 'easeOut' }}
            />
        </svg>
    );
}

export default function InterviewDemo() {
    const { ref, step, replay, reduced } = useStepLoop(DURATIONS, { hold: FINAL_HOLD });

    return (
        <DemoFrame
            frameRef={ref}
            caption="An example I wrote to show the habit. The data and questions are made up."
            onReplay={reduced ? undefined : replay}
        >
            <div className="sr-only">
                <p>Animated example of letting the agent ask the questions first. The person writes: {PROMPT}</p>
                <ul>
                    {TURNS.map((turn) => (
                        <li key={turn.question}>
                            The agent asks: {turn.question} The person answers: {turn.answer} SPEC.md gains the line: {turn.spec}
                        </li>
                    ))}
                </ul>
                <p>The agent closes with: {CLOSING} The note at the end of SPEC.md reads: {REVIEWED}</p>
            </div>

            <div aria-hidden="true" className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                <TerminalWindow title="~/demo" minHeight={340} className="h-full">
                    <div className="space-y-3">
                        <TerminalLine marker="❯" markerClass={term.prompt}>
                            <TypedLine text={PROMPT} active={step >= PROMPT_STEP} speed={PROMPT_SPEED} caret />
                        </TerminalLine>

                        {TURNS.map((turn, index) => (
                            <div key={turn.question} className="space-y-1">
                                <Fade show={step >= questionStep(index)}>
                                    <TerminalLine marker="●" markerClass={term.dim}>
                                        {turn.question}
                                    </TerminalLine>
                                </Fade>
                                <Fade show={step >= answerStep(index)}>
                                    <TerminalLine marker="❯" markerClass={term.prompt}>
                                        <TypedLine text={turn.answer} active={step >= answerStep(index)} speed={ANSWER_SPEED} className="text-white" />
                                    </TerminalLine>
                                </Fade>
                            </div>
                        ))}

                        <Fade show={step >= CLOSING_STEP}>
                            <TerminalLine marker="●" markerClass={term.dim}>
                                {CLOSING}
                            </TerminalLine>
                        </Fade>
                    </div>
                </TerminalWindow>

                <div className="card-bg flex h-full flex-col rounded-2xl border border-neutral-200 px-5 py-5 font-serif shadow-sm dark:border-neutral-800 sm:px-7 sm:py-6">
                    <p className="border-b border-neutral-200 pb-2.5 text-xs tracking-wide text-neutral-600 dark:border-neutral-800 dark:text-neutral-500">SPEC.md</p>
                    <p className="mt-4 text-xl font-semibold text-primary">Duplicate check</p>

                    <ul className="m-0 mt-3 list-none space-y-0 p-0">
                        {TURNS.map((turn, index) => {
                            const landed = step >= answerStep(index);
                            const delay = specDelay(turn.answer);
                            return (
                                <li key={turn.spec} className="flex gap-2.5 border-b border-dashed border-neutral-200 py-2.5">
                                    <Tick show={landed} delay={delay} />
                                    <Fade show={landed} delay={delay} className="min-w-0 flex-1 text-[15px] leading-snug text-primary">
                                        {turn.spec}
                                    </Fade>
                                </li>
                            );
                        })}
                    </ul>

                    <Fade show={step >= REVIEWED_STEP} className="mt-auto pt-4 text-[13px] italic leading-snug text-neutral-600 dark:text-neutral-500">
                        {REVIEWED}
                    </Fade>
                </div>
            </div>
        </DemoFrame>
    );
}
