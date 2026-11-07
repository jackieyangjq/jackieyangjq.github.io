'use client';

import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { DemoFrame, Pictogram, useStepLoop } from '@/components/guide/primitives';

interface MadeUpReference {
    text: string;
    title: string;
    year: string;
    real: boolean;
}

const REFERENCES: MadeUpReference[] = [
    {
        text: 'Chen, L. & Park, S. (2021). Hotel demand after a visa change. Journal of Examples, 12(3). doi:10.5555/ex.2021.12',
        title: 'Hotel demand after a visa change',
        year: '2021',
        real: true,
    },
    {
        text: 'Rossi, M. (2019). Text as data in tourism. Example Review, 8(1). doi:10.5555/ex.2019.08',
        title: 'Text as data in tourism',
        year: '2019',
        real: true,
    },
    {
        text: 'Okafor, D. & Lind, A. (2023). Seasonal prices in coastal hotels. Journal of Examples, 15(2). doi:10.5555/ex.2023.99',
        title: 'Seasonal prices in coastal hotels',
        year: '2023',
        real: false,
    },
    {
        text: 'Nguyen, T. (2020). Measuring reviews at scale. Example Letters, 4(4). doi:10.5555/ex.2020.04',
        title: 'Measuring reviews at scale',
        year: '2020',
        real: true,
    },
];

const LOOKING_UP = 'Looking up DOI…';
const NO_SUCH_DOI = 'No such DOI';
const SUMMARY = '3 of 4 real. 1 removed before it reached the paper.';
const DESCRIPTION =
    'Animation of four made-up references being checked against their DOIs, one at a time. ' +
    'References 1, 2 and 4 are found, and their title and year match the DOI record. ' +
    'Reference 3 has no such DOI, so it is struck through and removed. ' +
    SUMMARY;

// Step 0 is a short pause. Each reference then gets a "looking up" step and a result step.
// Reference 3 has one more, which holds on the removal. The last step is the summary.
const DURATIONS = [1200, 1300, 2100, 1300, 1900, 1700, 1600, 3800, 1300, 1900, 0];
const SUMMARY_HOLD = 5500;
const SUMMARY_STEP = DURATIONS.length - 1;
const LOOKUP_STEP = [1, 3, 5, 8];
const REMOVED_STEP = 7;
const ROW_AT_STEP = [0, 0, 0, 1, 1, 2, 2, 2, 3, 3, 3];

type Phase = 'waiting' | 'looking' | 'found' | 'missing';

function phaseOf(row: number, step: number): Phase {
    const lookup = LOOKUP_STEP[row];
    if (step < lookup) return 'waiting';
    if (step === lookup) return 'looking';
    return REFERENCES[row].real ? 'found' : 'missing';
}

/** One state in a stack. Every state keeps its place in the grid cell, so the cell's size never changes. */
function Layer({ show, className = '', children }: { show: boolean; className?: string; children?: React.ReactNode }) {
    return (
        <motion.div
            initial={false}
            animate={{ opacity: show ? 1 : 0, y: show ? 0 : 4 }}
            // The old state clears before the new one arrives, so the two texts never sit on top of each other.
            transition={show ? { duration: 0.4, delay: 0.18, ease: 'easeOut' } : { duration: 0.18, ease: 'easeOut' }}
            style={{ gridArea: '1 / 1' }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

function ReferenceRow({ reference, phase, removed }: { reference: MadeUpReference; phase: Phase; removed: boolean }) {
    const missing = phase === 'missing';
    return (
        <div className="relative grid grid-cols-1 content-center gap-x-4 gap-y-1.5 border-b border-neutral-200 px-3 py-3 last:border-b-0 dark:border-neutral-800 sm:grid-cols-[minmax(0,1fr)_7.5rem]">
            <p className="m-0 min-w-0 break-words font-serif text-[13px] leading-snug text-primary sm:text-sm">
                {/* The line is a background on the inline text, so it draws across every wrapped line in turn. */}
                <motion.span
                    initial={false}
                    animate={{ backgroundSize: missing ? '100% 1.5px' : '0% 1.5px' }}
                    transition={{ duration: missing ? 1.2 : 0.35, ease: 'easeInOut' }}
                    style={{ backgroundImage: 'linear-gradient(var(--accent), var(--accent))', backgroundRepeat: 'no-repeat', backgroundPosition: '0 60%' }}
                >
                    <motion.span initial={false} animate={{ opacity: missing ? 0.65 : 1 }} transition={{ duration: 0.8 }}>
                        {reference.text}
                    </motion.span>
                </motion.span>
            </p>
            <div className="grid items-center text-xs sm:items-start">
                <Layer show={phase === 'waiting'} className="flex h-4 items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
                </Layer>
                <Layer show={phase === 'looking'} className="text-neutral-600 dark:text-neutral-500">
                    {LOOKING_UP}
                </Layer>
                {reference.real ? (
                    <Layer show={phase === 'found'} className="flex items-center gap-1 font-medium text-primary">
                        <Check className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                        Found
                    </Layer>
                ) : (
                    <Layer show={missing} className="flex flex-wrap items-center gap-x-2 gap-y-1 sm:flex-col sm:items-start">
                        <span className="flex items-center gap-1 font-medium text-accent">
                            <X className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                            {NO_SUCH_DOI}
                        </span>
                        <motion.span
                            initial={false}
                            animate={{ opacity: removed ? 1 : 0 }}
                            transition={{ duration: 0.6 }}
                            className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[11px] font-medium leading-none text-accent"
                        >
                            Removed
                        </motion.span>
                    </Layer>
                )}
            </div>
        </div>
    );
}

/** The side-by-side view for the reference being checked: what the draft says, and what the DOI record says. */
function Comparison({ reference, phase, show }: { reference: MadeUpReference; phase: Phase; show: boolean }) {
    const label = 'mb-1 text-[11px] text-neutral-600 dark:text-neutral-500';
    const title = 'font-serif text-[13px] leading-snug text-primary sm:text-sm';
    const year = 'mt-0.5 font-serif text-[13px] leading-snug text-neutral-600 dark:text-neutral-500 sm:text-sm';
    return (
        <Layer show={show} className="grid grid-cols-2 gap-x-4 sm:gap-x-6">
            <div className="min-w-0">
                <div className={label}>In the reference</div>
                <div className={title}>{reference.title}</div>
                <div className={year}>{reference.year}</div>
            </div>
            <div className="min-w-0">
                <div className={label}>In the DOI record</div>
                <div className="grid">
                    <Layer show={phase === 'looking'} className="text-[13px] leading-snug text-neutral-600 dark:text-neutral-500 sm:text-sm">
                        {LOOKING_UP}
                    </Layer>
                    {reference.real ? (
                        <Layer show={phase === 'found'}>
                            <div className={title}>{reference.title}</div>
                            <div className={year}>{reference.year}</div>
                        </Layer>
                    ) : (
                        <Layer show={phase === 'missing'} className="flex items-center gap-1 text-[13px] font-medium leading-snug text-accent sm:text-sm">
                            <X className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                            {NO_SUCH_DOI}
                        </Layer>
                    )}
                </div>
            </div>
        </Layer>
    );
}

export default function ReferenceCheck() {
    const { ref, step, replay, reduced } = useStepLoop(DURATIONS, { hold: SUMMARY_HOLD });
    const row = ROW_AT_STEP[step];
    const scanning = step > 0 && step < SUMMARY_STEP;
    const looking = scanning && phaseOf(row, step) === 'looking';

    return (
        <DemoFrame caption="Made-up references, to show the check." onReplay={reduced ? undefined : replay} frameRef={ref}>
            <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_11rem] md:items-center md:gap-8">
                <div role="img" aria-label={DESCRIPTION} className="card-bg min-w-0 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                    <div className="px-2 py-2 sm:px-3">
                        {/* Rows share one height, so the highlight can move by its own height, whatever the screen width. */}
                        <div className="relative grid auto-rows-fr">
                            <motion.div
                                initial={false}
                                animate={{ y: `${row * 100}%`, opacity: scanning ? 1 : 0 }}
                                transition={{ duration: 0.7, ease: 'easeInOut' }}
                                className="pointer-events-none absolute inset-x-0 top-0 h-1/4 overflow-hidden rounded-lg border-l-2 border-accent bg-accent/[0.07] dark:bg-accent/[0.12]"
                            >
                                <motion.div
                                    initial={false}
                                    animate={{ scaleX: looking ? 1 : 0, opacity: looking ? 1 : 0 }}
                                    transition={{ scaleX: { duration: looking ? 1.2 : 0, delay: looking ? 0 : 0.4, ease: 'linear' }, opacity: { duration: 0.4 } }}
                                    style={{ originX: 0 }}
                                    className="absolute inset-x-0 bottom-0 h-px bg-accent/60"
                                />
                            </motion.div>
                            {REFERENCES.map((reference, index) => (
                                <ReferenceRow key={reference.text} reference={reference} phase={phaseOf(index, step)} removed={step >= REMOVED_STEP} />
                            ))}
                        </div>
                    </div>
                    <div className="grid border-t border-neutral-200 px-5 py-4 dark:border-neutral-800 sm:px-6">
                        {REFERENCES.map((reference, index) => (
                            <Comparison key={reference.text} reference={reference} phase={phaseOf(index, step)} show={scanning && row === index} />
                        ))}
                        <Layer show={step === SUMMARY_STEP} className="flex items-center font-serif text-base leading-snug text-primary sm:text-lg">
                            {SUMMARY}
                        </Layer>
                    </div>
                </div>
                <div className="flex items-center gap-4 md:flex-col md:items-start md:gap-3">
                    <div className="flex flex-shrink-0">
                        <Pictogram name="carbon-justice" className="h-20 w-20 text-accent" />
                    </div>
                    <p className="m-0 font-serif text-base leading-snug text-primary">A model can write a reference that looks convincing but does not exist.</p>
                </div>
            </div>
        </DemoFrame>
    );
}
