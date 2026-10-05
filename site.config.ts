/**
 * ============================================================================
 *  SITE CONFIG — the only file you need to edit to make this template yours.
 * ============================================================================
 *
 *  Everything the visitor reads (brand name, SEO metadata, navigation, all
 *  scroll-panel copy, the gallery, the events list and every contact link)
 *  lives here. The components read from this file; none of them hardcode copy.
 *
 *  Colours, fonts and 3D scene geometry are NOT here — see:
 *    app/globals.css              design tokens (colours, radii, shadows)
 *    app/layout.tsx               font choices (next/font/google)
 *    components/three/*           the 3D room, sky, particles
 *    lib/cameraPath.ts            the camera journey through the room
 *
 *  Search for "TODO" to find every value that must be replaced before launch.
 */

// ─────────────────────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────────────────────

/** A single line of a scroll-panel heading. `accent: true` renders it in the
 *  accent colour + italic — use it for the one line you want to land hardest. */
export interface HeadingLine {
  text: string;
  accent?: boolean;
}

/** One scroll-driven text panel. `start`/`end` are scroll progress (0–1) —
 *  the panel fades in at `start` and out at `end`. Windows may not overlap
 *  unless you want two panels on screen at once. */
export interface CopyPanel {
  id: string;
  start: number;
  end: number;
  /** Horizontal alignment of the panel within the viewport. */
  align: "center" | "left" | "right";
  /** Vertical alignment of the panel within the viewport. */
  valign: "top" | "center" | "bottom";
  /** Heading lines, rendered stacked. */
  lines: HeadingLine[];
  /** Optional small uppercase caption under the heading. */
  caption?: string;
  /** Optional thin glowing rule above the heading. */
  rule?: boolean;
  /** Renders as one large centred paragraph instead of stacked headings. */
  variant?: "stack" | "statement";
}

export interface GalleryImage {
  /** Path under /public — e.g. "/gallery/placeholder-01.svg". */
  src: string;
  /** Alt text. Keep it empty ("") for purely decorative imagery. */
  alt: string;
}

export interface EventItem {
  /** Day number shown large on the date chip, e.g. "27". */
  day: string;
  /** Short label under the day, e.g. "FRI" or "MAR". */
  month: string;
  /** Small uppercase event name. */
  name: string;
  /** One-sentence description, rendered in italic serif. */
  description: string;
  /** Small uppercase detail line, e.g. "Free entry · 40 seats". */
  detail: string;
  /** Status pill text, e.g. "OPEN" / "FILLING UP" / "SOLD OUT". */
  status: string;
  /** Status pill colour — any CSS colour. */
  statusColor: string;
  /** Optional link. Omit to render the card as non-clickable. */
  href?: string;
}

export interface SocialLink {
  /** Small uppercase label above the icon. */
  platform: string;
  /** The handle / address shown under the icon. */
  handle: string;
  href: string;
  /** Brand colour — drives the icon, glow and hover border. */
  color: string;
  /** Icon key — see SOCIAL_ICONS in components/SocialIcons.tsx.
   *  Add your own there if the platform you need isn't listed. */
  icon: SocialIconKey;
}

export type SocialIconKey =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "x"
  | "linkedin"
  | "facebook"
  | "discord"
  | "email"
  | "whatsapp"
  | "phone"
  | "globe"
  | "community";

export interface ContactRow {
  /** Small uppercase label. */
  label: string;
  /** The larger value line, e.g. a phone number or group name. */
  value: string;
  href: string;
  color: string;
  icon: SocialIconKey;
  /** `feature` gives the row the filled accent treatment (use for one row). */
  emphasis?: "subtle" | "feature";
}

// ─────────────────────────────────────────────────────────────────────────────
//  BRAND
// ─────────────────────────────────────────────────────────────────────────────

export const brand = {
  /** TODO — your brand name. Used in the nav logo and as the SEO site name. */
  name: "Archie",

  /** TODO — the nav wordmark. Kept short; the nav pill is small. */
  wordmark: "angel",

  /** TODO — one-line positioning statement. Appears in <title> after the name. */
  tagline: "me is me..i love coding and playing with new things..",

  /** TODO — short location/edition code shown between rules in the hero.
   *  Set to "" to hide that row entirely. */
  locationCode: "europe/Monaco",
} as const;

// ─────────────────────────────────────────────────────────────────────────────
//  SEO / METADATA
// ─────────────────────────────────────────────────────────────────────────────

export const seo = {
  /** TODO — your production URL. Used to resolve relative OG image paths. */
  url: "https://archie.web.int.yt",

  /** TODO — 150–160 characters. Shown in search results and link previews. */
  description:
    "So, well, I don't really do much... just create things that I find fun... feel free to share your idea's/Projects or if you need help, just hit me up.. :)",

  /** TODO — a handful of terms you want to rank for. */
  keywords: ["Archie is me", "exploring", "Monaco", "bleh", "let's E-SEX"],

  /** TODO — social share image (1200×630 recommended). Path under /public. */
  ogImage: "/nom.js",
  ogImageAlt: "bleh..whatever..",

  /** Browser chrome colour on mobile. Match your --bg token. */
  themeColor: "#000000",

  /** Set false while the site is unfinished to keep it out of search results. */
  indexable: true,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
//  NAVIGATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Nav links, in order. Each entry maps a label to a point on the scroll journey.
 *
 *  target — where clicking scrolls to, as a fraction of total page scroll (0–1)
 *  from / to — the progress window during which this link shows as "active"
 *
 * `target` is deliberately a page-scroll fraction while `from`/`to` are journey
 * progress: the page is slightly taller than the journey (see `journey.pages`),
 * so the two differ. `navTargetFor()` below converts for you.
 */
export const nav = {
  links: [
    { label: "About", target: 0.20, from: 0.12, to: 0.26 },
    { label: "Gallery", target: 0.52, from: 0.50, to: 0.64 },
    { label: "Events", target: 0.76, from: 0.73, to: 0.84 },
    { label: "Community", target: 0.84, from: 0.84, to: 0.92 },
  ],

  /** The call-to-action button at the right of the nav pill. */
  cta: { label: "JOIN", target: 0.95, from: 0.93, to: 1.0 },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
//  JOURNEY
// ─────────────────────────────────────────────────────────────────────────────

export const journey = {
  /**
   * Total scroll height as a multiple of the viewport. Higher = slower, more
   * cinematic; lower = snappier. 9 means the page is 900vh tall.
   */
  pages: 9,
} as const;

/** Convert a `nav` target (journey progress) into a page-scroll fraction. */
export function navTargetFor(target: number): number {
  return (target * (journey.pages - 1)) / journey.pages;
}

// ─────────────────────────────────────────────────────────────────────────────
//  HERO  (scroll progress 0 → 0.08)
// ─────────────────────────────────────────────────────────────────────────────

export const hero = {
  /** TODO — small spaced-out word above the wordmark. "" hides it. */
  eyebrow: WELCOME,

  /** TODO — the large cursive wordmark. Keep it to one short word. */
  wordmark: "Archie",

  /** TODO — the line under the divider rules. "" hides it. */
  tagline: What should i even say? i love my gf, perhaps,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
//  COPY PANELS
// ─────────────────────────────────────────────────────────────────────────────
//  Add, remove or reorder freely — the renderer just walks this array. Keep the
//  progress windows inside 0–1 and clear of the gallery / events / contact
//  windows below, which are defined separately because they render rich cards.
// ─────────────────────────────────────────────────────────────────────────────

export const copyPanels: CopyPanel[] = [
  {
    id: "intro",
    start: 0.12,
    end: 0.23,
    align: "left",
    valign: "bottom",
    rule: true,
    lines: [
      { text: "well I just wanted to say" },
      { text: "thank you, to all the good people who" },
      { text: "supported me throughout my journey.", accent: true },
    ],
    caption: "THOUGH I LOVE YA'LL BUT I LOVE MY GF MORE..",
  },
  {
    id: "value",
    start: 0.25,
    end: 0.37,
    align: "right",
    valign: "center",
    rule: true,
    lines: [
      { text: "and well if i ever disappear," },
      { text: "just know that i tried my best," },
      { text: "and in the end i still lost." },
    ],
    caption: "BUT CHEER UP, I'M STILL HERE.",
  },
  {
    id: "promise",
    start: 0.39,
    end: 0.5,
    align: "center",
    valign: "center",
    lines: [
      { text: "You'll have to promise me though.." },
      { text: "That you'll try your best?" },
      { text: "Not for anyone else, but yourself", accent: true },
    ],
  },
  {
    id: "principles",
    start: 0.63,
    end: 0.73,
    align: "left",
    valign: "center",
    lines: [
      { text: "let's talk about my interests.." },
      { text: "I love anime, games, webtoons/manga coding" },
      { text: "i Love AI, I love ya'll." },
      { text: "Though I love my gf more... :3", accent: true },
    ],
  },
  {
    id: "closing",
    start: 0.84,
    end: 0.91,
    align: "center",
    valign: "center",
    variant: "statement",
    lines: [
      { text: "so..well it's kinda hard to explain..but you know." },
      { text: "everyone has their own issues...", accent: true },
      { text: "like i have a lil problem..but that's a secret..hehe" },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  GALLERY  (a tappable stack of photos)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO — drop your own images into /public/gallery and list them here.
 * Images keep their natural aspect ratio (the stack is deliberately uneven),
 * so a mix of portrait and landscape looks best. 3+ images required.
 */
const galleryImages: GalleryImage[] = [
  { src: "/gallery/placeholder-01.jpg", alt: "" },
  { src: "/gallery/placeholder-02.svg", alt: "" },
  { src: "/gallery/placeholder-03.svg", alt: "" },
  { src: "/gallery/placeholder-04.jpg", alt: "" },
  { src: "/gallery/placeholder-05.svg", alt: "" },
  { src: "/gallery/placeholder-06.jpg", alt: "" },
];

export const gallery = {
  /** Scroll window for the gallery panel. */
  start: 0.5,
  end: 0.61,

  /** TODO — heading above the stack. */
  title: "Gallery",

  /** Small hint under the counter. */
  hint: "Tap it",

  images: galleryImages,
};

// ─────────────────────────────────────────────────────────────────────────────
//  EVENTS
// ─────────────────────────────────────────────────────────────────────────────

/** TODO — your events. An empty array hides the whole panel. */
const eventItems: EventItem[] = [
  {
    day: "01",
    month: "MON",
    name: "no events you idiots",
    description:
      "bleh..no events.. I'll update it from time to time..",
    detail: "you can join my server though · https://discord.gg/UWANhmZQgx",
    status: "OPEN",
    statusColor: "#86efac",
    href: "https://discord.gg/UWANhmZQgx",
  },
  {
    day: "02",
    month: "TUE",
    name: "YUP STILL NO EVENTS..",
    description:
      "WHAT TF SHOULD I EVEN PUT HERE??",
    detail: "more bleh.. · MUHEHEHE",
    status: "IT'S OPEN",
    statusColor: "#fbbf24",
  },
];

export const events = {
  /** Scroll window for the events card. */
  start: 0.75,
  end: 0.82,

  /** TODO — small uppercase label above the heading. */
  eyebrow: "join the server :3",

  /** TODO — the card heading. */
  title: "Nothing's on.",

  items: eventItems,
};

// ─────────────────────────────────────────────────────────────────────────────
//  CONTACT  (the final card)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * TODO — your social accounts. Rendered in a 2-column grid, so an even
 * number (2, 4, 6) looks best. An empty array hides the grid.
 */
const socials: SocialLink[] = [
  {
    platform: "Instagram",
    handle: "@secret",
    href: "https://discord.gg/UWANhmZQgx",
    color: "#E1306C",
    icon: "instagram",
  },
  {
    platform: "TikTok",
    handle: "@anothersecret",
    href: "https://discord.gg/UWANhmZQgx",
    color: "#69C9D0",
    icon: "tiktok",
  },
  {
    platform: "YouTube",
    handle: "secretsss",
    href: "https://discord.gg/UWANhmZQgx",
    color: "#FF4444",
    icon: "youtube",
  },
  {
    platform: "Email",
    handle: "bleh, don't click..",
    href: "https://discord.gg/UWANhmZQgx",
    color: "#7C4FE8",
    icon: "email",
  },
];

/**
 * TODO — full-width rows under the social grid. Give exactly one row
 * `emphasis: "feature"` to make it read as the primary action.
 */
const contactRows: ContactRow[] = [
  {
    label: "Direct",
    value: "i ain't giving you that..",
    href: "yuh no",
    color: "#25D366",
    icon: "whatsapp",
    emphasis: "subtle",
  },
  {
    label: "Join the Community",
    value: "don't touch i said..",
    href: "https://discord.gg/UWANhmZQgx",
    color: "#a78bfa",
    icon: "community",
    emphasis: "feature",
  },
];

export const contact = {
  /** Scroll window for the final card — should end at 1.0. */
  start: 0.91,
  end: 1.0,

  /** TODO — small uppercase label above the heading. */
  eyebrow: "Archie :3",

  /** TODO — the card heading. */
  title: "Bleh.",

  socials,
  rows: contactRows,
};

// ─────────────────────────────────────────────────────────────────────────────
//  MISC UI STRINGS
// ─────────────────────────────────────────────────────────────────────────────

export const ui = {
  /** Label under the animated line at the bottom of the hero. */
  scrollHint: "SCROLL",
  /** Mobile menu dismiss label. */
  closeLabel: "CLOSE",
} as const;
