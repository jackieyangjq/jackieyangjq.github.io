'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { AnimatePresence, motion, useInView } from 'framer-motion';
import { Play, RotateCcw, X, ZoomIn } from 'lucide-react';

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';
const subscribeReduced = (onChange: () => void) => {
    const media = window.matchMedia(REDUCED_QUERY);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
};

/** False on the server and during hydration, then the real setting. */
export function useReducedMotion() {
    return useSyncExternalStore(subscribeReduced, () => window.matchMedia(REDUCED_QUERY).matches, () => false);
}

/**
 * Plays a sequence of steps while the element is on screen.
 * `durations[i]` is how long step i stays up, in ms. After the last step it holds, then loops.
 * Off screen it pauses. With reduced motion it stays on the last step, so the final state is shown.
 */
export function useStepLoop(durations: number[], { hold = 3500, loop = true, reducedStep }: { hold?: number; loop?: boolean; reducedStep?: number } = {}) {
    const ref = useRef<HTMLDivElement>(null);
    const visible = useInView(ref, { amount: 0.3 });
    const reduced = useReducedMotion();
    const last = durations.length - 1;
    const [step, setStep] = useState(0);
    const [run, setRun] = useState(0);

    useEffect(() => {
        if (reduced || !visible) return;
        if (step >= last) {
            if (!loop) return;
            const timer = setTimeout(() => setStep(0), hold);
            return () => clearTimeout(timer);
        }
        const timer = setTimeout(() => setStep((s) => s + 1), durations[step]);
        return () => clearTimeout(timer);
        // durations is a constant in each demo
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, visible, reduced, last, loop, hold, run]);

    const replay = useCallback(() => {
        setStep(0);
        setRun((r) => r + 1);
    }, []);

    return { ref, step: reduced ? (reducedStep ?? last) : step, replay, reduced: !!reduced };
}

/** Types `text` once `active` is true. Shows it all at once with reduced motion. */
export function Typed({ text, active = true, speed = 28, caret = false }: { text: string; active?: boolean; speed?: number; caret?: boolean }) {
    const reduced = useReducedMotion();
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!active || reduced) {
            setCount(0);
            return;
        }
        let i = 0;
        const timer = setInterval(() => {
            i += 1;
            setCount(i);
            if (i >= text.length) clearInterval(timer);
        }, speed);
        return () => clearInterval(timer);
    }, [text, active, speed, reduced]);

    const shown = reduced ? text : active ? text.slice(0, count) : '';
    return (
        <span>
            <span className="sr-only">{text}</span>
            <span aria-hidden="true">{shown}</span>
            {caret && active && !reduced && count < text.length && (
                <span aria-hidden="true" className="ml-px inline-block h-[1em] w-[0.5em] translate-y-[0.15em] bg-current opacity-70" />
            )}
        </span>
    );
}

/** Dark terminal frame. It stays dark in both site themes. `minHeight` stops the page jumping between steps. */
export function TerminalWindow({
    title,
    minHeight = 280,
    children,
    className = '',
}: {
    title?: string;
    minHeight?: number;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={`relative overflow-hidden rounded-xl bg-[#1c1917] shadow-lg ring-1 ring-black/20 ${className}`}>
            <div className="flex items-center gap-1.5 border-b border-white/10 px-3.5 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                {title && <span className="ml-2 truncate font-mono text-[11px] text-white/50">{title}</span>}
            </div>
            <div className="relative overflow-x-auto p-4 font-mono text-[12px] leading-relaxed text-[#e7e4e0] sm:text-[13px]" style={{ minHeight }}>
                {children}
            </div>
        </div>
    );
}

/** Text colours for use inside TerminalWindow, which has a fixed dark background. */
export const term = {
    prompt: 'text-[#f4a9b3]',
    dim: 'text-white/45',
    ok: 'text-[#9fd8a9]',
    warn: 'text-[#f5c97a]',
    bad: 'text-[#f4a9b3]',
    box: 'rounded-lg border border-white/15 bg-white/[0.04]',
};

/** Frame for an animated demo, with a caption and a replay button. */
export function DemoFrame({ caption, onReplay, children, frameRef }: { caption?: string; onReplay?: () => void; children: React.ReactNode; frameRef?: React.Ref<HTMLDivElement> }) {
    return (
        <figure ref={frameRef}>
            {children}
            {(caption || onReplay) && (
                <figcaption className="mt-2 flex items-start justify-between gap-4 text-xs leading-relaxed text-neutral-500">
                    <span>{caption}</span>
                    {onReplay && (
                        <button
                            type="button"
                            onClick={onReplay}
                            className="inline-flex flex-shrink-0 items-center gap-1 rounded font-medium text-accent hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        >
                            <RotateCcw className="h-3 w-3" aria-hidden="true" />
                            Replay
                        </button>
                    )}
                </figcaption>
            )}
        </figure>
    );
}

/** IBM Carbon pictogram, recoloured with a CSS mask so the file stays untouched and it follows the theme. */
export function Pictogram({ name, className = 'h-12 w-12 text-accent' }: { name: string; className?: string }) {
    const url = `url(/images/ai-workflow/${name}.svg)`;
    return (
        <span
            aria-hidden="true"
            className={`inline-block bg-current ${className}`}
            style={{ maskImage: url, WebkitMaskImage: url, maskSize: 'contain', WebkitMaskSize: 'contain', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskPosition: 'center' }}
        />
    );
}

export interface GalleryImage {
    src: string;
    alt: string;
    caption: string;
    credit?: string;
    credit_href?: string;
    poster?: string; // set for a GIF: shows this still until the reader presses play
    width?: number;
    height?: number;
}

/** One image with a caption. Click to enlarge. A GIF shows its poster until played. */
export function ImageCard({ image, className = '' }: { image: GalleryImage; className?: string }) {
    const [open, setOpen] = useState(false);
    const [playing, setPlaying] = useState(false);
    const isGif = !!image.poster;
    const trigger = useRef<HTMLButtonElement>(null);
    const close = useCallback(() => {
        setOpen(false);
        trigger.current?.focus();
    }, []);

    useEffect(() => {
        if (!open) return;
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') close();
            if (event.key === 'Tab') event.preventDefault(); // Close is the only control in the dialog
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, close]);

    return (
        <figure className={`flex flex-col ${className}`}>
            <button
                ref={trigger}
                type="button"
                onClick={() => (isGif ? setPlaying((p) => !p) : setOpen(true))}
                aria-label={isGif ? `${playing ? 'Stop' : 'Play'} animation: ${image.alt}` : `Enlarge image: ${image.alt}`}
                className="group relative block w-full overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-neutral-800"
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={isGif && !playing ? image.poster : image.src} alt={image.alt} width={image.width} height={image.height} loading="lazy" decoding="async" className="block h-auto w-full" />
                {isGif && !playing && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors group-hover:bg-black/20">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg">
                            <Play className="ml-0.5 h-6 w-6" aria-hidden="true" />
                        </span>
                    </span>
                )}
                {!isGif && (
                    <span className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                        <ZoomIn className="h-4 w-4" aria-hidden="true" />
                    </span>
                )}
            </button>
            <figcaption className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-500">
                {image.caption}
                {image.credit && (
                    <span className="mt-0.5 block text-xs text-neutral-500">
                        {image.credit_href ? (
                            <a href={image.credit_href} target="_blank" rel="noopener noreferrer" className="hover:text-accent hover:underline underline-offset-4">
                                {image.credit}
                            </a>
                        ) : (
                            image.credit
                        )}
                    </span>
                )}
            </figcaption>
            <AnimatePresence>
                {open && (
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-label={image.alt}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={close}
                        className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 sm:p-10"
                    >
                        <button type="button" autoFocus aria-label="Close" onClick={close} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
                            <X className="h-5 w-5" aria-hidden="true" />
                        </button>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={image.src} alt={image.alt} className="max-h-full max-w-full rounded-lg bg-white object-contain" />
                    </motion.div>
                )}
            </AnimatePresence>
        </figure>
    );
}
