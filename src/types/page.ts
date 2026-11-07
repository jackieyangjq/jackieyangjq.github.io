export interface BasePageConfig {
    type: 'about' | 'publication' | 'card' | 'text' | 'research' | 'guide';
    title: string;
    description?: string;
}

export interface PublicationPageConfig extends BasePageConfig {
    type: 'publication';
    source: string;
}

export interface LinkItem {
    label: string;
    href: string;
}

export interface TextPageConfig extends BasePageConfig {
    type: 'text';
    source: string;
    downloads?: (LinkItem & { note?: string })[];
}

export interface CardItem {
    title: string;
    subtitle?: string;
    date?: string;
    content?: string;
    tags?: string[];
    link?: string;
    image?: string;
    image_alt?: string;
    links?: LinkItem[];
}

export interface CardGroup {
    title: string;
    description?: string;
    layout?: 'list' | 'grid';
    items: CardItem[];
}

export interface CardPageConfig extends BasePageConfig {
    type: 'card';
    items?: CardItem[];
    groups?: CardGroup[];
}

export interface ResearchItem {
    title: string;
    status?: string;
    venue?: string;
    authorship?: string;
    award?: string;
    summary?: string;
    finding?: string;
    figure?: string;
    figure_alt?: string;
    figure_caption?: string;
    methods?: string[];
    links?: LinkItem[];
}

export interface ResearchGroup {
    id: string;
    title: string;
    description?: string;
    items?: ResearchItem[];
}

export interface MethodArea {
    title: string;
    methods: string[];
    link?: LinkItem;
}

export interface ResearchPageConfig extends BasePageConfig {
    type: 'research';
    note?: string;
    groups: ResearchGroup[];
    methods_title?: string;
    methods_description?: string;
    method_areas?: MethodArea[];
}

export interface GuideStep {
    title: string;
    label?: string;
    body?: string;
    icon?: string;
}

export interface GuideTile {
    title: string;
    body?: string;
    icon?: string;
    picto?: string;
}

export interface GuideStage {
    stage: string;
    ai: string;
    me: string;
}

export interface GuideLevel {
    name: string;
    research: string;
    web: string;
}

export interface GuideFoldItem {
    title: string;
    fix: string;
    body: string;
    demo?: string;
    caution?: string;
    more_label?: string;
    more_href?: string;
}

export interface GuideCard {
    title: string;
    body?: string;
    points?: string[];
}

export interface GuideExample {
    label: string;
    href: string;
    note?: string;
    image?: string;
    image_alt?: string;
}

export interface GuideImage {
    src: string;
    alt: string;
    caption: string;
    credit?: string;
    credit_href?: string;
    poster?: string;
    width?: number;
    height?: number;
}

export interface GuideReading {
    label: string;
    href: string;
    source: string;
    note: string;
}

export interface GuideCredit {
    what: string;
    who: string;
    licence: string;
    href: string;
}

export interface GuideSection {
    id: string;
    title: string;
    nav?: string;
    lead?: string;
    callout?: string;
    note?: string;
    tiles?: GuideTile[];
    examples_title?: string;
    examples?: GuideExample[];
    timeline_labels?: string[];
    timeline?: GuideStage[];
    steps_style?: 'pills' | 'flow';
    steps?: GuideStep[];
    level_labels?: string[];
    default_level?: number;
    levels?: GuideLevel[];
    fix_label?: string;
    folds?: GuideFoldItem[];
    cards?: GuideCard[];
    demo?: 'interview' | 'commands' | 'sessions' | 'errors' | 'rules';
    illustration?: string;
    illustration_alt?: string;
    gallery_title?: string;
    gallery?: GuideImage[];
    reading?: GuideReading[];
    credits?: GuideCredit[];
    credits_note?: string;
}

export interface GuidePageConfig extends BasePageConfig {
    type: 'guide';
    links?: LinkItem[];
    banner?: string;
    banner_alt?: string;
    sections: GuideSection[];
}
