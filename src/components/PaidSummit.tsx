import { Fragment, useEffect, useLayoutEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { BedDouble, ConciergeBell, Utensils } from "lucide-react";
import emblem from "../assets/amber-emblem.png";

/* ------------------------------------------------------------------ *
 * AMBER — Amber Hospitality. Continuous looping brand promo.
 * One central <stage> of fixed design size, scaled to fit the viewport.
 * A step driver walks the script; elements read their target per-step
 * and Motion tweens between them. The closing section is a data-driven
 * "welcome" sequence (English alone, then greetings four at a time).
 * ------------------------------------------------------------------ */

// Design constants (px). Stage is scaled to fit the viewport.
const STAGE_W = 900;
const STAGE_H = 340;
const NARROW_W = 196; // slightly wider than half the ball (BALL/2 = 170)
const BALL = STAGE_H; // ball diameter == box height

const GOLD = "#deb100"; // primary
const CHARCOAL = "#373737"; // secondary — dark surfaces + text
const LIGHT = "rgb(236, 236, 236)"; // secondary — light surface
// Zero-alpha stops that share the RGB of the colour they fade to/from, so the
// tween only changes alpha (no grey "ghost" midtone — Motion mixes RGB and
// alpha independently).
const TRANSP_W = "rgba(236, 236, 236, 0)"; // <-> light
const TRANSP_C = "rgba(55, 55, 55, 0)"; //   <-> charcoal (#373737)

const S1 =
  "Welcome to Amber Hospitality, a hospitality management and development...";
const S2 =
  "company, created by hoteliers and financial professionals in Africa, to bring";
const S3 =
  "trusted expertise and exceptional professional hospitality management solutions.";

/* ----------------------------- welcome data ----------------------- */

type Greeting = { hi: string; lang: string };

// English stands alone (slide 0); the rest are shown four at a time.
const GREETINGS: Greeting[] = [
  { hi: "WELCOME", lang: "English" },
  { hi: "Sawubona", lang: "IsiZulu" },
  { hi: "Wamkelekile", lang: "Xhosa" },
  { hi: "Samukele", lang: "Ndebele" },
  { hi: "Welkom", lang: "Afrikaans" },
  { hi: "Titambirei", lang: "Shona" },
  { hi: "Akwaaba", lang: "Twi" },
  { hi: "Wòezɔ", lang: "Ewe" },
  { hi: "Ẹ káàbọ̀", lang: "Yoruba" },
  { hi: "Nnọọ", lang: "Igbo" },
  { hi: "Barka da Zuwa", lang: "Hausa" },
  { hi: "Obokhian", lang: "Bini" },
  { hi: "Koyo", lang: "Etsako" },
  { hi: "Dalal ak jàmm", lang: "Wolof" },
  { hi: "Karibu", lang: "Swahili" },
  { hi: "Kulikayo", lang: "Luganda" },
  { hi: "Kabo", lang: "Krio" },
  { hi: "Mbote", lang: "Lingala" },
  { hi: "Do Waye", lang: "Bari" },
  { hi: "Mwaiseni", lang: "Bemba" },
  { hi: "Takulandirani", lang: "Chichewa" },
  { hi: "እንኳን ደህና መጣህ", lang: "Amharic" },
  { hi: "Baga Nagaan Dhuftee", lang: "Oromo" },
  { hi: "Murakaza neza", lang: "Kinyarwanda" },
  { hi: "Soo dhowaada", lang: "Somali" },
  { hi: "ⴰⵏⵚⵓⴼ ⵢⵉⵙ ⵡⴻⵏ", lang: "Tamazight (Moroccan Berber)" },
  { hi: "أهلاً وسهلاً", lang: "Arabic" },
  { hi: "Avilakoa", lang: "Fur (Sudan)" },
  { hi: "Oi", lang: "Kriolu (Cape Verde)" },
  { hi: "Marhaba", lang: "Northern African Arabic" },
];

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Slide 0 = English alone; the remaining greetings in groups of four.
const WELCOME_SLIDES: Greeting[][] = [
  [GREETINGS[0]],
  ...chunk(GREETINGS.slice(1), 4),
];

/* ----------------------------- icons ------------------------------ */

type IconName = "ball" | "bell" | "bed" | "dine";

// Three hospitality icons that alternate across the welcome slides.
const HOSP: IconName[] = ["bell", "bed", "dine"];

/* ----------------------------- steps ------------------------------ */

type Kind =
  | "intro"
  | "shrinkLogo"
  | "type1"
  | "type2"
  | "type3"
  | "toBlue"
  | "ballSweep"
  | "welcome"
  | "outro";

type Step = { kind: Kind; ms: number; slide?: number };

const STEPS: Step[] = [
  { kind: "intro", ms: 1500 },
  { kind: "shrinkLogo", ms: 1100 },
  { kind: "type1", ms: 3300 },
  { kind: "type2", ms: 3100 },
  { kind: "type3", ms: 3100 },
  { kind: "toBlue", ms: 1500 },
  { kind: "ballSweep", ms: 2400 },
  ...WELCOME_SLIDES.map((s, idx) => ({
    kind: "welcome" as const,
    ms: s.length === 1 ? 1600 : 1900,
    slide: idx,
  })),
  { kind: "outro", ms: 2800 },
];

const NARROW: Kind[] = ["ballSweep", "welcome"];

/* ----------------------------- helpers ---------------------------- */

function boxTarget(k: Kind) {
  const width = NARROW.includes(k) ? NARROW_W : STAGE_W;
  let backgroundColor = LIGHT;
  if (k === "shrinkLogo" || k === "type1" || k === "type2") {
    backgroundColor = TRANSP_W; // fading down from the light intro box
  } else if (k === "type3") {
    backgroundColor = TRANSP_C; // pre-tinted charcoal so toBlue fades in clean
  } else if (k === "toBlue" || k === "ballSweep") {
    backgroundColor = CHARCOAL;
  }
  return { width, backgroundColor };
}

function logoTarget(k: Kind) {
  if (k === "intro") return { top: "50%", scale: 1, opacity: 1 };
  if (k === "outro") return { top: "50%", scale: 1, opacity: 0 };
  const visible =
    k === "shrinkLogo" || k === "type1" || k === "type2" || k === "type3";
  return { top: "78%", scale: 0.4, opacity: visible ? 1 : 0 };
}

function iconFor(step: Step): IconName | null {
  if (step.kind === "toBlue" || step.kind === "ballSweep") return "ball";
  if (step.kind === "welcome") return HOSP[(step.slide ?? 0) % HOSP.length];
  return null;
}

function welcomeFor(step: Step): Greeting[] | null {
  return step.kind === "welcome" ? WELCOME_SLIDES[step.slide ?? 0] : null;
}

function sentenceFor(k: Kind): string | null {
  if (k === "type1") return S1;
  if (k === "type2") return S2;
  if (k === "type3") return S3;
  return null;
}

/* ----------------------------- pieces ----------------------------- */

/** Reveals `text` one word at a time; each word fades in and slides down slightly. */
function TypeWords({ text, speed = 200 }: { text: string; speed?: number }) {
  const reduce = useReducedMotion();
  const words = text.split(" ");
  const [n, setN] = useState(0);

  useEffect(() => {
    if (reduce) {
      setN(words.length);
      return;
    }
    setN(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setN(i);
      if (i >= words.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
    // words is derived from text; depending on text keeps this stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, speed, reduce]);

  return (
    <>
      {words.slice(0, n).map((w, idx) => (
        <Fragment key={idx}>
          <motion.span
            className="inline-block"
            initial={reduce ? false : { opacity: 0, y: -9 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            {w}
          </motion.span>
          {idx < words.length - 1 ? " " : ""}
        </Fragment>
      ))}
    </>
  );
}

function LucideGlyph({ name }: { name: Exclude<IconName, "ball"> }) {
  const props = { strokeWidth: 1.4 as const, className: "h-[56%] w-[56%]" };
  switch (name) {
    case "bell":
      return <ConciergeBell {...props} />;
    case "bed":
      return <BedDouble {...props} />;
    case "dine":
      return <Utensils {...props} />;
    default: {
      const _exhaustive: never = name;
      return _exhaustive;
    }
  }
}

/** Icon anchored so its centre rides the box's right edge (overflow = half). */
function IconStage({ name, kind }: { name: IconName | null; kind: Kind }) {
  const reduce = useReducedMotion();
  return (
    <div
      className="pointer-events-none"
      style={{
        position: "absolute",
        top: "50%",
        right: 0,
        height: "100%",
        aspectRatio: "1",
        transform: "translate(50%,-50%)",
      }}
    >
      <AnimatePresence>
        {name && (
          <motion.div
            key={name}
            className="absolute inset-0 flex items-center justify-center"
            style={{ color: name === "ball" ? GOLD : CHARCOAL }}
            initial={
              name === "ball" ? { opacity: 0 } : { opacity: 0, y: "40%" }
            }
            animate={{ opacity: 1, y: 0 }}
            exit={name === "ball" ? { opacity: 0 } : { opacity: 0, y: "-28%" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {name === "ball" ? (
              <motion.img
                src={emblem}
                alt=""
                draggable={false}
                className="h-full w-full object-contain"
                initial={{ rotate: 0 }}
                // Lands on a multiple of 360° so it settles upright (A up).
                animate={{
                  rotate: reduce ? 0 : kind === "ballSweep" ? 1080 : 360,
                }}
                transition={{
                  rotate: {
                    duration: kind === "ballSweep" ? 2.4 : 1.5,
                    ease: "linear",
                  },
                }}
              />
            ) : (
              <LucideGlyph name={name} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Right-side welcome text: one greeting (English) or four at a time. */
function WelcomePanel({
  items,
  slideKey,
}: {
  items: Greeting[] | null;
  slideKey: number;
}) {
  const big = items?.length === 1;
  return (
    <div
      className="flex items-center justify-center"
      style={{
        position: "absolute",
        top: "50%",
        right: 0,
        width: STAGE_W * 0.52,
        transform: "translateY(-50%)",
      }}
    >
      <AnimatePresence mode="wait">
        {items && (
          <motion.div
            key={slideKey}
            className="flex w-full flex-col items-center gap-4 text-center"
            initial={{ opacity: 0, y: -22 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 22 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {items.map((g, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center leading-tight"
              >
                <span
                  className="font-semibold text-white"
                  style={{ fontSize: big ? 56 : 30 }}
                >
                  {g.hi}
                </span>
                <span
                  className="mt-1 font-semibold uppercase tracking-[0.18em]"
                  style={{ color: GOLD, fontSize: big ? 14 : 12 }}
                >
                  {g.lang}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ----------------------------- main ------------------------------- */

function useFitScale(designW: number, designH: number, pad = 40) {
  const [scale, setScale] = useState(1);
  // useLayoutEffect so the first measured scale is applied before paint (no flash).
  useLayoutEffect(() => {
    const calc = () => {
      const w = (window.innerWidth - pad * 2) / designW;
      const h = (window.innerHeight - pad * 2) / designH;
      setScale(Math.min(1, w, h));
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [designW, designH, pad]);
  return scale;
}

export default function PaidSummit() {
  const [i, setI] = useState(0);
  const step = STEPS[i];
  const kind = step.kind;
  const scale = useFitScale(STAGE_W + BALL / 2, STAGE_H);

  useEffect(() => {
    const t = setTimeout(
      () => setI((p) => (p + 1) % STEPS.length),
      STEPS[i].ms
    );
    return () => clearTimeout(t);
  }, [i]);

  const sentence = sentenceFor(kind);
  const welcome = welcomeFor(step);
  const isOutro = kind === "outro";

  return (
    <main
      className="flex min-h-screen items-center justify-center overflow-hidden bg-black"
      aria-label="Amber Hospitality"
    >
      {/* Static text alternative for assistive tech; the animation is decorative. */}
      <p className="sr-only">
        Amber Hospitality. Welcome to Amber Hospitality, a hospitality
        management and development company, created by hoteliers and financial
        professionals in Africa, to bring trusted expertise and exceptional
        professional hospitality management solutions. Hospitality is Our DNA.
        Welcome — in the languages of Africa. The Foremost African Indigenous
        Hospitality Brand.
      </p>
      <div style={{ transform: `scale(${scale})` }} aria-hidden="true">
        <div style={{ position: "relative", width: STAGE_W, height: STAGE_H }}>
          {/* The box: light -> transparent -> charcoal -> light. Shrinks from the
              right during the ball sweep, then expands back out for the outro. */}
          <motion.div
            className="absolute left-0 top-0 overflow-visible"
            style={{ height: STAGE_H, borderRadius: 6 }}
            animate={boxTarget(kind)}
            transition={{
              duration: kind === "ballSweep" ? 1.9 : 1.0,
              ease: [0.6, 0, 0.3, 1],
            }}
          >
            {/* Brand line — top left, only during intro */}
            <motion.div
              className="absolute left-8 top-6 text-left leading-tight"
              style={{ color: CHARCOAL }}
              animate={{ opacity: kind === "intro" ? 1 : 0 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.22em]">
                Hospitality &amp;
                <br />
                Management
              </p>
            </motion.div>

            {/* Tagline — fades in on charcoal, then out across the whole sweep */}
            <motion.div
              className="absolute left-10 top-1/2 -translate-y-1/2 text-white"
              style={{ width: 380 }}
              animate={{ opacity: kind === "toBlue" ? 1 : 0 }}
              transition={{
                duration: kind === "ballSweep" ? 1.7 : 0.7,
                delay: kind === "ballSweep" ? 0.2 : 0,
              }}
            >
              <p className="text-[34px] font-semibold leading-tight">
                Hospitality is Our DNA
              </p>
            </motion.div>

            <IconStage name={iconFor(step)} kind={kind} />
          </motion.div>

          {/* Right-side welcome greetings */}
          <WelcomePanel items={welcome} slideKey={step.slide ?? -1} />

          {/* Outro headline */}
          <motion.div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            animate={{ opacity: isOutro ? 1 : 0, scale: isOutro ? 1 : 0.96 }}
            transition={{ duration: 0.7, delay: isOutro ? 0.5 : 0 }}
          >
            <span
              className="text-center text-[40px] font-bold leading-tight"
              style={{
                color: CHARCOAL,
                display: "inline-block",
                maxWidth: 680,
              }}
            >
              The Foremost African Indigenous Hospitality Brand
            </span>
          </motion.div>

          {/* AMBER wordmark */}
          <motion.div
            className="absolute"
            style={{ left: "50%" }}
            animate={{ x: "-50%", y: "-50%", ...logoTarget(kind) }}
            transition={{
              duration: kind === "shrinkLogo" ? 0.9 : 0.6,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <span
              className="font-extrabold tracking-tight"
              style={{ color: GOLD, fontSize: 150, lineHeight: 1 }}
            >
              AMBER
            </span>
          </motion.div>

          {/* Typed sentences, above the wordmark */}
          <div
            className="text-center"
            style={{
              position: "absolute",
              top: "40%",
              left: "50%",
              width: 490,
              transform: "translate(-50%,-50%)",
            }}
          >
            <AnimatePresence mode="wait">
              {sentence && (
                <motion.p
                  key={sentence}
                  className="text-[30px] font-medium leading-snug text-white"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                >
                  <TypeWords text={sentence} />
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  );
}
