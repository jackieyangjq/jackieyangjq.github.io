'use client';

import { useState } from 'react';
import { AnimatePresence, motion, useScroll, useSpring, type Variants } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
    ArrowRight,
    ArrowUpRight,
    Bot,
    ChevronDown,
    ClipboardList,
    Eye,
    KeyRound,
    LayoutList,
    MessagesSquare,
    ShieldCheck,
    Target,
    type LucideIcon,
} from 'lucide-react';
import { GuidePageConfig, GuideSection } from '@/types/page';
import CommandLab from '@/components/guide/CommandLab';
import InterviewDemo from '@/components/guide/InterviewDemo';
import ReferenceCheck from '@/components/guide/ReferenceCheck';
import SessionsDiagram from '@/components/guide/SessionsDiagram';
import SilentErrors from '@/components/guide/SilentErrors';
import { ImageCard, Pictogram } from '@/components/guide/primitives';

// Icon names used in content/*.toml
const ICONS: Record<string, LucideIcon> = {
    messages: MessagesSquare,
    eye: Eye,
    target: Target,
    key: KeyRound,
    clipboard: ClipboardList,
    bot: Bot,
    shield: ShieldCheck,
    board: LayoutList,
};

const ease = [0.22, 1, 0.36, 1] as const;

const reveal: Variants = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};

const stagger: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
};

const inView = { once: true, margin: '0px 0px -80px 0px' } as const;

function isInternal(href?: string) {
    return !!href && href.startsWith('/');
}

const inlineMarkdown = {
    p: ({ children }: React.ComponentProps<'p'>) => <p className="mb-2 last:mb-0">{children}</p>,
    a: ({ href, children }: React.ComponentProps<'a'>) => (
        <a
            href={href}
            {...(isInternal(href) ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
            className="text-accent font-medium hover:underline underline-offset-4"
        >
            {children}
        </a>
    ),
    strong: ({ children }: React.ComponentProps<'strong'>) => <strong className="font-semibold text-primary">{children}</strong>,
    em: ({ children }: React.ComponentProps<'em'>) => <em className="italic">{children}</em>,
};

function Md({ children }: { children: string }) {
    return <ReactMarkdown components={inlineMarkdown}>{children}</ReactMarkdown>;
}

const card = 'card-bg rounded-2xl border border-neutral-200 dark:border-neutral-800';
const eyebrow = 'text-xs font-semibold uppercase tracking-wider';

function Tiles({ section }: { section: GuideSection }) {
    if (!section.tiles?.length) return null;
    return (
        <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {section.tiles.map((tile) => {
                const Icon = (tile.icon && ICONS[tile.icon]) || Target;
                return (
                    <motion.div
                        key={tile.title}
                        variants={reveal}
                        whileHover={{ y: -3 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                        className={`${card} p-5 flex flex-row md:flex-col gap-4 shadow-sm hover:shadow-md transition-shadow`}
                    >
                        {tile.picto ? (
                            <Pictogram name={tile.picto} className="h-12 w-12 flex-shrink-0 text-accent" />
                        ) : (
                            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                                <Icon className="h-5 w-5" aria-hidden="true" />
                            </span>
                        )}
                        <div className="min-w-0">
                            <h3 className="font-semibold text-primary">{tile.title}</h3>
                            {tile.body && (
                                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-500 leading-relaxed">{tile.body}</p>
                            )}
                        </div>
                    </motion.div>
                );
            })}
        </motion.div>
    );
}

function Examples({ section }: { section: GuideSection }) {
    if (!section.examples?.length) return null;
    return (
        <motion.div variants={reveal}>
            {section.examples_title && <p className={`${eyebrow} text-neutral-500 mb-3`}>{section.examples_title}</p>}
            <ul className="grid gap-4 sm:grid-cols-3">
                {section.examples.map((example) => (
                    <li key={example.label}>
                        <a
                            href={example.href}
                            {...(isInternal(example.href) ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
                            className={`group ${card} block h-full overflow-hidden shadow-sm hover:shadow-md transition-shadow`}
                        >
                            {example.image && (
                                <span className="block aspect-[16/10] overflow-hidden border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={example.image}
                                        alt={example.image_alt || ''}
                                        loading="lazy"
                                        className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                                    />
                                </span>
                            )}
                            <span className="block p-4">
                                <span className="flex items-center justify-between gap-2 font-semibold text-primary group-hover:text-accent transition-colors">
                                    {example.label}
                                    <ArrowUpRight className="h-4 w-4 flex-shrink-0 text-neutral-400 group-hover:text-accent transition-colors" aria-hidden="true" />
                                </span>
                                {example.note && <span className="mt-1 block text-sm text-neutral-600 dark:text-neutral-500 leading-relaxed">{example.note}</span>}
                            </span>
                        </a>
                    </li>
                ))}
            </ul>
        </motion.div>
    );
}

function Gallery({ section }: { section: GuideSection }) {
    if (!section.gallery?.length) return null;
    return (
        <motion.div variants={reveal}>
            {section.gallery_title && <p className={`${eyebrow} text-neutral-500 mb-3`}>{section.gallery_title}</p>}
            <div className="grid gap-6 sm:grid-cols-2">
                {section.gallery.map((image) => (
                    <ImageCard key={image.src} image={image} />
                ))}
            </div>
        </motion.div>
    );
}

function Reading({ section }: { section: GuideSection }) {
    if (!section.reading?.length) return null;
    return (
        <motion.ul variants={stagger} className="grid gap-3 sm:grid-cols-2">
            {section.reading.map((item) => (
                <motion.li key={item.href} variants={reveal}>
                    <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`group ${card} block h-full p-4 shadow-sm hover:shadow-md transition-shadow`}
                    >
                        <span className={`${eyebrow} text-accent`}>{item.source}</span>
                        <span className="mt-1 flex items-start justify-between gap-2 font-semibold text-primary group-hover:text-accent transition-colors">
                            {item.label}
                            <ArrowUpRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-400 group-hover:text-accent transition-colors" aria-hidden="true" />
                        </span>
                        <span className="mt-1 block text-sm text-neutral-600 dark:text-neutral-500 leading-relaxed">{item.note}</span>
                    </a>
                </motion.li>
            ))}
        </motion.ul>
    );
}

function Credits({ section }: { section: GuideSection }) {
    if (!section.credits?.length) return null;
    return (
        <motion.details variants={reveal} className="group text-xs text-neutral-500">
            <summary className="cursor-pointer font-medium hover:text-accent">Image credits and licences</summary>
            {section.credits_note && <p className="mt-2 max-w-3xl leading-relaxed">{section.credits_note}</p>}
            <ul className="mt-2 space-y-1 leading-relaxed">
                {section.credits.map((credit) => (
                    <li key={credit.what}>
                        {credit.what}: {credit.who}.{' '}
                        <a href={credit.href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-accent">
                            {credit.licence}
                        </a>
                    </li>
                ))}
            </ul>
        </motion.details>
    );
}

function Timeline({ section }: { section: GuideSection }) {
    if (!section.timeline?.length) return null;
    const [aiLabel, meLabel] = section.timeline_labels || ['AI', 'Me'];
    return (
        <div className="relative">
            <motion.span
                aria-hidden="true"
                className="absolute left-3 top-3 bottom-3 w-px -translate-x-1/2 bg-accent/30 origin-top"
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={inView}
                transition={{ duration: 1.4, ease }}
            />
            <motion.ol variants={stagger} className="space-y-7">
                {section.timeline.map((item, index) => (
                    <motion.li key={item.stage} variants={reveal} className="relative pl-11">
                        <span className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-accent bg-background text-[11px] font-semibold text-accent">
                            {index + 1}
                        </span>
                        <h3 className="font-semibold text-primary leading-6">{item.stage}</h3>
                        <div className="mt-2 grid gap-x-8 gap-y-2 sm:grid-cols-2 text-sm leading-relaxed">
                            <p className="text-neutral-600 dark:text-neutral-500">
                                <span className="mr-2 inline-block rounded-md bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-500">
                                    {aiLabel}
                                </span>
                                {item.ai}
                            </p>
                            <p className="text-neutral-700 dark:text-neutral-600">
                                <span className="mr-2 inline-block rounded-md bg-accent/10 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent">
                                    {meLabel}
                                </span>
                                {item.me}
                            </p>
                        </div>
                    </motion.li>
                ))}
            </motion.ol>
        </div>
    );
}

function Pills({ section }: { section: GuideSection }) {
    if (!section.steps?.length) return null;
    const last = section.steps.length - 1;
    return (
        <motion.ol variants={stagger} className="flex flex-wrap items-center gap-2">
            {section.steps.map((step, index) => (
                <motion.li key={step.title} variants={reveal} className="flex items-center gap-2">
                    <span className="card-bg inline-flex items-baseline gap-2 rounded-full border border-neutral-200 dark:border-neutral-800 px-4 py-1.5 shadow-sm">
                        <span className="text-sm font-semibold text-primary">{step.title}</span>
                        {step.label && <span className="text-xs font-medium text-accent">{step.label}</span>}
                    </span>
                    {index < last && <ArrowRight className="h-4 w-4 text-neutral-400" aria-hidden="true" />}
                </motion.li>
            ))}
        </motion.ol>
    );
}

function Flow({ section }: { section: GuideSection }) {
    if (!section.steps?.length) return null;
    return (
        <div className="relative">
            <motion.span
                aria-hidden="true"
                className="hidden lg:block absolute top-6 left-[12.5%] right-[12.5%] h-px bg-accent/30 origin-left"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={inView}
                transition={{ duration: 1.2, ease, delay: 0.2 }}
            />
            <motion.ol variants={stagger} className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
                {section.steps.map((step) => {
                    const Icon = (step.icon && ICONS[step.icon]) || ClipboardList;
                    return (
                        <motion.li key={step.title} variants={reveal} className="relative flex flex-col items-start lg:items-center lg:text-center">
                            <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-accent/30 bg-background text-accent shadow-sm">
                                <Icon className="h-5 w-5" aria-hidden="true" />
                            </span>
                            {step.label && <span className={`${eyebrow} mt-4 text-accent`}>{step.label}</span>}
                            <h3 className="mt-1 text-lg font-semibold text-primary">{step.title}</h3>
                            {step.body && (
                                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-500 leading-relaxed">{step.body}</p>
                            )}
                        </motion.li>
                    );
                })}
            </motion.ol>
        </div>
    );
}

function Levels({ section }: { section: GuideSection }) {
    const levels = section.levels || [];
    const [active, setActive] = useState(Math.min(section.default_level ?? 0, Math.max(levels.length - 1, 0)));
    if (!levels.length) return null;
    const current = levels[active];
    const [researchLabel, webLabel] = section.level_labels || ['In research', 'In web coding'];

    return (
        <motion.div variants={reveal} className={`${card} p-5 sm:p-6 shadow-sm`}>
            <div className="flex flex-wrap items-center gap-4">
                <div role="tablist" aria-label="Effort level" className="inline-flex rounded-full bg-neutral-100 dark:bg-neutral-800 p-1">
                    {levels.map((level, index) => {
                        const selected = index === active;
                        return (
                            <button
                                key={level.name}
                                type="button"
                                role="tab"
                                aria-selected={selected}
                                aria-controls={`${section.id}-level-panel`}
                                onClick={() => setActive(index)}
                                className={`relative rounded-full px-3.5 sm:px-4 py-1.5 text-sm font-medium transition-colors ${
                                    selected ? 'text-white dark:text-neutral-50' : 'text-neutral-600 dark:text-neutral-500 hover:text-primary'
                                }`}
                            >
                                {selected && (
                                    <motion.span
                                        layoutId={`${section.id}-level-pill`}
                                        className="absolute inset-0 rounded-full bg-accent shadow-sm"
                                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                                    />
                                )}
                                <span className="relative">{level.name}</span>
                            </button>
                        );
                    })}
                </div>
                <div className="flex items-end gap-1 h-6" aria-hidden="true">
                    {levels.map((level, index) => (
                        <span
                            key={level.name}
                            style={{ height: `${8 + index * 5}px` }}
                            className={`w-1.5 rounded-full transition-colors duration-300 ${
                                index <= active ? 'bg-accent' : 'bg-neutral-200 dark:bg-neutral-700'
                            }`}
                        />
                    ))}
                </div>
            </div>
            <div id={`${section.id}-level-panel`} role="tabpanel" className="mt-5 min-h-[5.5rem]">
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={current.name}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.22, ease }}
                        className="grid gap-4 sm:grid-cols-2"
                    >
                        <div>
                            <p className={`${eyebrow} text-neutral-500`}>{researchLabel}</p>
                            <p className="mt-1 text-neutral-700 dark:text-neutral-600 leading-relaxed">{current.research}</p>
                        </div>
                        <div>
                            <p className={`${eyebrow} text-neutral-500`}>{webLabel}</p>
                            <p className="mt-1 text-neutral-700 dark:text-neutral-600 leading-relaxed">{current.web}</p>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

function Folds({ section }: { section: GuideSection }) {
    const [open, setOpen] = useState<number | null>(null);
    if (!section.folds?.length) return null;
    return (
        <motion.ul
            variants={stagger}
            className={`${card} divide-y divide-neutral-200 dark:divide-neutral-800 overflow-hidden shadow-sm`}
        >
            {section.folds.map((item, index) => {
                const isOpen = open === index;
                const panelId = `${section.id}-fold-${index}`;
                return (
                    <motion.li key={item.title} variants={reveal}>
                        <button
                            type="button"
                            aria-expanded={isOpen}
                            aria-controls={panelId}
                            onClick={() => setOpen(isOpen ? null : index)}
                            className="w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-accent/5 transition-colors"
                        >
                            <span className="w-6 flex-shrink-0 pt-0.5 font-serif text-sm tabular-nums text-accent/70">
                                {String(index + 1).padStart(2, '0')}
                            </span>
                            <span className="flex-1 min-w-0">
                                <span className="block font-semibold text-primary">{item.title}</span>
                                <span className="mt-1 block text-sm text-neutral-600 dark:text-neutral-500 leading-relaxed">
                                    {section.fix_label && <span className="font-semibold text-accent">{section.fix_label}: </span>}
                                    {item.fix}
                                </span>
                            </span>
                            <motion.span
                                animate={{ rotate: isOpen ? 180 : 0 }}
                                transition={{ duration: 0.25, ease }}
                                className="mt-0.5 flex-shrink-0 text-neutral-400"
                            >
                                <ChevronDown className="h-5 w-5" aria-hidden="true" />
                            </motion.span>
                        </button>
                        <AnimatePresence initial={false}>
                            {isOpen && (
                                <motion.div
                                    id={panelId}
                                    key="panel"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease }}
                                    className="overflow-hidden"
                                >
                                    <p className="pb-5 pl-[3.75rem] pr-12 text-sm text-neutral-700 dark:text-neutral-600 leading-relaxed">
                                        {item.body}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.li>
                );
            })}
        </motion.ul>
    );
}

function Cards({ section }: { section: GuideSection }) {
    if (!section.cards?.length) return null;
    return (
        <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {section.cards.map((item) => (
                <motion.div key={item.title} variants={reveal} className={`${card} p-5 sm:p-6 shadow-sm`}>
                    <h3 className="font-semibold text-primary mb-3">{item.title}</h3>
                    {item.body && (
                        <div className="text-sm text-neutral-700 dark:text-neutral-600 leading-relaxed">
                            <Md>{item.body}</Md>
                        </div>
                    )}
                    {item.points && item.points.length > 0 && (
                        <ul className="space-y-2 text-sm text-neutral-700 dark:text-neutral-600 leading-relaxed">
                            {item.points.map((point) => (
                                <li key={point} className="flex gap-2.5">
                                    <span className="mt-2 h-1 w-1 rounded-full bg-accent flex-shrink-0" aria-hidden="true" />
                                    <span className="min-w-0">
                                        <Md>{point}</Md>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </motion.div>
            ))}
        </motion.div>
    );
}

export default function GuidePage({ config }: { config: GuidePageConfig }) {
    const { scrollYProgress } = useScroll();
    const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

    return (
        <>
            <motion.div
                aria-hidden="true"
                className="fixed top-0 left-0 right-0 z-[60] h-0.5 bg-accent origin-left"
                style={{ scaleX: progress }}
            />

            <motion.header variants={stagger} initial="hidden" animate="show" className="mb-16">
                {config.banner && (
                    <motion.div variants={reveal} className="mb-8 overflow-hidden rounded-2xl">
                        <motion.img
                            src={config.banner}
                            alt={config.banner_alt || ''}
                            initial={{ scale: 1.06 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 1.6, ease }}
                            className="h-40 w-full object-cover object-[50%_42%] sm:h-56"
                        />
                    </motion.div>
                )}
                <motion.h1 variants={reveal} className="text-4xl sm:text-5xl font-serif font-bold text-primary">
                    {config.title}
                </motion.h1>
                <motion.span
                    aria-hidden="true"
                    className="mt-5 block h-1 w-16 rounded-full bg-accent origin-left"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, ease, delay: 0.35 }}
                />
                {config.description && (
                    <motion.div variants={reveal} className="mt-5 text-lg text-neutral-600 dark:text-neutral-500 max-w-2xl leading-relaxed">
                        <Md>{config.description}</Md>
                    </motion.div>
                )}
                {config.links && config.links.length > 0 && (
                    <motion.div variants={reveal} className="mt-6 flex flex-wrap gap-3">
                        {config.links.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-white dark:text-neutral-50 hover:bg-accent-dark transition-colors shadow-sm text-sm font-semibold"
                            >
                                {link.label}
                                <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" aria-hidden="true" />
                            </a>
                        ))}
                    </motion.div>
                )}
                <motion.nav variants={reveal} aria-label="On this page" className="mt-8 flex flex-wrap gap-2">
                    {config.sections.map((section, index) => (
                        <a
                            key={section.id}
                            href={`#${section.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-500 hover:bg-accent hover:text-white dark:hover:text-neutral-50 transition-colors"
                        >
                            <span className="tabular-nums opacity-60">{String(index + 1).padStart(2, '0')}</span>
                            {section.nav || section.title}
                        </a>
                    ))}
                </motion.nav>
            </motion.header>

            <div className="space-y-20 sm:space-y-24">
                {config.sections.map((section, index) => (
                    <motion.section
                        key={section.id}
                        id={section.id}
                        className="scroll-mt-24"
                        variants={stagger}
                        initial="hidden"
                        whileInView="show"
                        viewport={inView}
                    >
                        <motion.div variants={reveal} className="mb-8">
                            <div className="flex items-baseline gap-3">
                                <span className="font-serif text-lg tabular-nums text-accent/70">{String(index + 1).padStart(2, '0')}</span>
                                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-primary">{section.title}</h2>
                            </div>
                            <div className="mt-3 flex items-center justify-between gap-8">
                                {section.lead && (
                                    <div className="max-w-2xl text-neutral-600 dark:text-neutral-500 leading-relaxed">
                                        <Md>{section.lead}</Md>
                                    </div>
                                )}
                                {section.illustration && (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                        src={section.illustration}
                                        alt={section.illustration_alt || ''}
                                        loading="lazy"
                                        className="hidden sm:block h-32 w-[171px] flex-shrink-0 object-contain dark:invert dark:opacity-80"
                                    />
                                )}
                            </div>
                        </motion.div>
                        <div className="space-y-8">
                            {section.demo === 'interview' && <InterviewDemo />}
                            {section.demo === 'commands' && <CommandLab folds={section.folds || []} fixLabel={section.fix_label} />}
                            {section.demo === 'sessions' && <SessionsDiagram />}
                            {section.demo === 'errors' && <SilentErrors folds={section.folds || []} fixLabel={section.fix_label} />}
                            {section.demo === 'rules' && <ReferenceCheck />}
                            <Tiles section={section} />
                            <Examples section={section} />
                            <Timeline section={section} />
                            {section.steps_style === 'flow' ? <Flow section={section} /> : <Pills section={section} />}
                            <Levels section={section} />
                            {!section.demo && <Folds section={section} />}
                            <Cards section={section} />
                            <Gallery section={section} />
                            <Reading section={section} />
                            <Credits section={section} />
                            {section.callout && (
                                <motion.div
                                    variants={reveal}
                                    className="rounded-xl border-l-4 border-accent bg-accent/5 px-5 py-4 text-sm text-neutral-700 dark:text-neutral-600 leading-relaxed max-w-3xl"
                                >
                                    <Md>{section.callout}</Md>
                                </motion.div>
                            )}
                            {section.note && (
                                <motion.div variants={reveal} className="text-xs text-neutral-500 leading-relaxed max-w-3xl">
                                    <Md>{section.note}</Md>
                                </motion.div>
                            )}
                        </div>
                    </motion.section>
                ))}
            </div>
        </>
    );
}
