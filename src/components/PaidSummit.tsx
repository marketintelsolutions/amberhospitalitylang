import { Fragment, useEffect, useLayoutEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Anchor, Armchair, Car, Lamp } from 'lucide-react'

/* ------------------------------------------------------------------ *
 * PAID — Pan African Interior & Design summit. Continuous looping promo.
 * One central <stage> of fixed design size, scaled to fit the viewport.
 * A phase driver steps through the script; elements read their target
 * per-phase and Motion tweens between them.
 * ------------------------------------------------------------------ */

type Phase =
  | 'intro'
  | 'shrinkPaid'
  | 'type1'
  | 'type2'
  | 'type3'
  | 'toBlue'
  | 'ballSweep'
  | 'carouselIntro'
  | 'culture'
  | 'wellbeing'
  | 'sustainability'
  | 'future'
  | 'outro'

const PHASES: { name: Phase; ms: number }[] = [
  { name: 'intro', ms: 1500 },
  { name: 'shrinkPaid', ms: 1100 },
  { name: 'type1', ms: 3300 },
  { name: 'type2', ms: 3100 },
  { name: 'type3', ms: 3100 },
  { name: 'toBlue', ms: 1500 },
  { name: 'ballSweep', ms: 2400 },
  { name: 'carouselIntro', ms: 1900 },
  { name: 'culture', ms: 1900 },
  { name: 'wellbeing', ms: 1900 },
  { name: 'sustainability', ms: 1900 },
  { name: 'future', ms: 1900 },
  { name: 'outro', ms: 2800 },
]

// Design constants (px). Stage is scaled to fit the viewport.
const STAGE_W = 900
const STAGE_H = 340
const NARROW_W = 196 // slightly wider than half the ball (BALL/2 = 170)
const BALL = STAGE_H // ball diameter == box height

const NAVY = '#15306b'
const RED = '#e11530'
const WHITE = '#ffffff'
const INK = '#101828'
// Zero-alpha stops that share the RGB of the colour they fade to/from, so the
// tween only changes alpha (no grey "ghost" midtone — Motion mixes RGB and
// alpha independently).
const TRANSP_W = 'rgba(255,255,255,0)' // <-> white
const TRANSP_N = 'rgba(21,48,107,0)' //   <-> navy (#15306b)

const S1 = 'A virtual summit of global design voices, consciously shaping…'
const S2 = 'the Pan-African interior design voice around professionalism,'
const S3 = 'culture, well-being and the future of spaces.'

const NARROW_PHASES: Phase[] = [
  'ballSweep',
  'carouselIntro',
  'culture',
  'wellbeing',
  'sustainability',
  'future',
  'outro', // stays narrow + fades out; the full white panel fades in over it
]

type IconName = 'ball' | 'chair' | 'car' | 'anchor' | 'lamp'

/* ----------------------------- helpers ---------------------------- */

function boxTarget(p: Phase) {
  const width = NARROW_PHASES.includes(p) ? NARROW_W : STAGE_W
  let backgroundColor = WHITE
  if (p === 'shrinkPaid' || p === 'type1' || p === 'type2') {
    backgroundColor = TRANSP_W // fading down from the white intro box
  } else if (p === 'type3') {
    backgroundColor = TRANSP_N // pre-tinted navy so toBlue fades in clean
  } else if (p === 'toBlue' || p === 'ballSweep' || p === 'carouselIntro') {
    backgroundColor = NAVY
  } else if (p === 'outro') {
    backgroundColor = TRANSP_W // narrow white box fades out under the panel
  }
  return { width, backgroundColor }
}

function paidTarget(p: Phase) {
  if (p === 'intro') return { top: '50%', scale: 1, opacity: 1 }
  if (p === 'outro') return { top: '50%', scale: 1, opacity: 0 }
  const visible =
    p === 'shrinkPaid' || p === 'type1' || p === 'type2' || p === 'type3'
  return { top: '78%', scale: 0.4, opacity: visible ? 1 : 0 }
}

function iconFor(p: Phase): IconName | null {
  if (p === 'toBlue' || p === 'ballSweep' || p === 'carouselIntro') return 'ball'
  if (p === 'culture') return 'chair'
  if (p === 'wellbeing') return 'car'
  if (p === 'sustainability') return 'anchor'
  if (p === 'future') return 'lamp'
  return null
}

type CarouselData =
  | { kind: 'triple' }
  | { kind: 'single'; text: string }
  | null

function carouselFor(p: Phase): CarouselData {
  if (p === 'carouselIntro') return { kind: 'triple' }
  if (p === 'culture') return { kind: 'single', text: 'culture' }
  if (p === 'wellbeing') return { kind: 'single', text: 'well being' }
  if (p === 'sustainability') return { kind: 'single', text: 'sustainability' }
  if (p === 'future') return { kind: 'single', text: 'the future of spaces' }
  return null
}

function sentenceFor(p: Phase): string | null {
  if (p === 'type1') return S1
  if (p === 'type2') return S2
  if (p === 'type3') return S3
  return null
}

/* ----------------------------- pieces ----------------------------- */

/** Reveals `text` one word at a time; each word fades in and slides down slightly. */
function TypeWords({ text, speed = 200 }: { text: string; speed?: number }) {
  const reduce = useReducedMotion()
  const words = text.split(' ')
  const [n, setN] = useState(0)

  useEffect(() => {
    if (reduce) {
      setN(words.length)
      return
    }
    setN(0)
    let i = 0
    const id = setInterval(() => {
      i += 1
      setN(i)
      if (i >= words.length) clearInterval(id)
    }, speed)
    return () => clearInterval(id)
    // words is derived from text; depending on text keeps this stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, speed, reduce])

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
          {idx < words.length - 1 ? ' ' : ''}
        </Fragment>
      ))}
    </>
  )
}

/** Hand-drawn ball with a meridian + orbiting marker so its spin reads. */
function BallIcon() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth={2.5}>
        <circle cx="50" cy="50" r="47" />
        <ellipse cx="50" cy="50" rx="19" ry="47" />
        <ellipse cx="50" cy="50" rx="47" ry="19" />
        <line x1="3" y1="50" x2="97" y2="50" />
        <line x1="50" y1="3" x2="50" y2="97" />
      </g>
      <circle cx="50" cy="14" r="5" fill="currentColor" />
    </svg>
  )
}

function LucideGlyph({ name }: { name: Exclude<IconName, 'ball'> }) {
  const props = { strokeWidth: 1.4 as const, className: 'h-[56%] w-[56%]' }
  switch (name) {
    case 'chair':
      return <Armchair {...props} />
    case 'car':
      return <Car {...props} />
    case 'anchor':
      return <Anchor {...props} />
    case 'lamp':
      return <Lamp {...props} />
    default: {
      const _exhaustive: never = name
      return _exhaustive
    }
  }
}

/** Icon anchored so its centre rides the box's right edge (overflow = half). */
function IconStage({ name }: { name: IconName | null }) {
  const reduce = useReducedMotion()
  return (
    <div
      className="pointer-events-none"
      style={{
        position: 'absolute',
        top: '50%',
        right: 0,
        height: '100%',
        aspectRatio: '1',
        transform: 'translate(50%,-50%)',
      }}
    >
      <AnimatePresence>
        {name && (
          <motion.div
            key={name}
            className="absolute inset-0 flex items-center justify-center"
            style={{ color: name === 'ball' ? WHITE : NAVY }}
            initial={name === 'ball' ? { opacity: 0 } : { opacity: 0, y: '40%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={name === 'ball' ? { opacity: 0 } : { opacity: 0, y: '-28%' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {name === 'ball' ? (
              <motion.div
                className="h-full w-full"
                animate={reduce ? undefined : { rotate: 360 }}
                transition={
                  reduce
                    ? undefined
                    : { repeat: Infinity, ease: 'linear', duration: 6 }
                }
              >
                <BallIcon />
              </motion.div>
            ) : (
              <LucideGlyph name={name} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Right-side text: 3-line intro, then single swapping pillars. */
function Carousel({ data }: { data: CarouselData }) {
  return (
    <div
      className="flex items-center justify-center text-center"
      style={{
        position: 'absolute',
        top: '50%',
        right: 0,
        width: STAGE_W * 0.5,
        transform: 'translateY(-50%)',
      }}
    >
      <AnimatePresence mode="wait">
        {data?.kind === 'triple' && (
          <motion.div
            key="triple"
            className="flex w-full flex-col items-center gap-6 text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <span className="text-[28px] font-semibold">three days</span>
            <span className="text-[28px] font-semibold">global voices</span>
            <span className="text-[28px] font-semibold">key notes &amp; conversation</span>
          </motion.div>
        )}
        {data?.kind === 'single' && (
          <motion.div
            key={data.text}
            className="w-full text-[40px] font-semibold text-white"
            initial={{ opacity: 0, y: -26 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 26 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {data.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ----------------------------- main ------------------------------- */

function useFitScale(designW: number, designH: number, pad = 40) {
  const [scale, setScale] = useState(1)
  // useLayoutEffect so the first measured scale is applied before paint (no flash).
  useLayoutEffect(() => {
    const calc = () => {
      const w = (window.innerWidth - pad * 2) / designW
      const h = (window.innerHeight - pad * 2) / designH
      setScale(Math.min(1, w, h))
    }
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [designW, designH, pad])
  return scale
}

export default function PaidSummit() {
  const [i, setI] = useState(0)
  const phase = PHASES[i].name
  const scale = useFitScale(STAGE_W + BALL / 2, STAGE_H)

  useEffect(() => {
    const t = setTimeout(
      () => setI((p) => (p + 1) % PHASES.length),
      PHASES[i].ms,
    )
    return () => clearTimeout(t)
  }, [i])

  const sentence = sentenceFor(phase)
  const isOutro = phase === 'outro'

  return (
    <main
      className="flex min-h-screen items-center justify-center overflow-hidden bg-black"
      aria-label="PAID — Pan African Interior & Design"
    >
      {/* Static text alternative for assistive tech; the animation is decorative. */}
      <p className="sr-only">
        PAID — Pan African Interior &amp; Design. A virtual summit of global
        design voices, consciously shaping the Pan-African interior design voice
        around professionalism, culture, well-being and the future of spaces.
        Three days, global voices, key notes &amp; conversation. May 7–9, 2026.
        Curating our future.
      </p>
      <div style={{ transform: `scale(${scale})` }} aria-hidden="true">
        <div style={{ position: 'relative', width: STAGE_W, height: STAGE_H }}>
          {/* The box (white -> transparent -> navy -> white), shrinking from the right.
              At intro it snaps back to full-width white instantly, hidden under the
              fading outro panel, so the loop never shows a width "grow". */}
          <motion.div
            className="absolute left-0 top-0 overflow-visible"
            style={{ height: STAGE_H, borderRadius: 6 }}
            animate={boxTarget(phase)}
            transition={{
              duration:
                phase === 'intro' ? 0 : phase === 'ballSweep' ? 1.9 : 1.0,
              ease: [0.6, 0, 0.3, 1],
            }}
          >
            {/* PAN AFRICAN INTERIOR & — top right, only during intro */}
            <motion.div
              className="absolute left-8 top-6 text-left leading-tight"
              style={{ color: INK }}
              animate={{ opacity: phase === 'intro' ? 1 : 0 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.22em]">
                Pan African
                <br />
                Interior &amp;
              </p>
            </motion.div>

            {/* Date — fades in on blue, then fades out across the whole sweep */}
            <motion.div
              className="absolute left-10 top-1/2 -translate-y-1/2 text-white"
              animate={{ opacity: phase === 'toBlue' ? 1 : 0 }}
              transition={{
                duration: phase === 'ballSweep' ? 1.7 : 0.7,
                delay: phase === 'ballSweep' ? 0.2 : 0,
              }}
            >
              <p className="text-[34px] font-semibold leading-tight">
                May 7–
                <br />9, 2026
              </p>
            </motion.div>

            <IconStage name={iconFor(phase)} />
          </motion.div>

          {/* Right-side rotating text */}
          <Carousel data={carouselFor(phase)} />

          {/* Full-width white panel — fades in for the outro (no width "grow") */}
          <motion.div
            className="pointer-events-none absolute left-0 top-0"
            style={{
              width: STAGE_W,
              height: STAGE_H,
              backgroundColor: WHITE,
              borderRadius: 6,
            }}
            animate={{ opacity: isOutro ? 1 : 0 }}
            transition={{ duration: 0.6 }}
          />

          {/* Outro headline */}
          <motion.div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            animate={{ opacity: isOutro ? 1 : 0, scale: isOutro ? 1 : 0.96 }}
            transition={{ duration: 0.7, delay: isOutro ? 0.5 : 0 }}
          >
            <span className="text-5xl font-bold" style={{ color: INK }}>
              curating our future
            </span>
          </motion.div>

          {/* PAID */}
          <motion.div
            className="absolute"
            style={{ left: '50%' }}
            animate={{ x: '-50%', y: '-50%', ...paidTarget(phase) }}
            transition={{
              duration: phase === 'shrinkPaid' ? 0.9 : 0.6,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <span
              className="font-black tracking-tight"
              style={{ color: RED, fontSize: 150, lineHeight: 1 }}
            >
              PAID
            </span>
          </motion.div>

          {/* Typed sentences, above PAID */}
          <div
            className="text-center"
            style={{
              position: 'absolute',
              top: '40%',
              left: '50%',
              width: 330,
              transform: 'translate(-50%,-50%)',
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
  )
}
