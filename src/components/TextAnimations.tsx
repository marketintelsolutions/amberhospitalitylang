import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

/**
 * Reveals each character with a staggered fade/slide/blur-in on mount.
 */
export function SplitText({
  text,
  className,
  delay = 0,
  stagger = 0.04,
}: {
  text: string
  className?: string
  delay?: number
  stagger?: number
}) {
  const chars = Array.from(text)
  return (
    <span className={className} aria-label={text}>
      {chars.map((char, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="inline-block"
          initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{
            duration: 0.5,
            delay: delay + i * stagger,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {char === ' ' ? ' ' : char}
        </motion.span>
      ))}
    </span>
  )
}

/**
 * Cycles through `words`, flipping each one in on the X axis.
 */
export function RotatingWord({
  words,
  className,
  interval = 2000,
}: {
  words: string[]
  className?: string
  interval?: number
}) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setIndex((i) => (i + 1) % words.length),
      interval,
    )
    return () => clearInterval(id)
  }, [words.length, interval])

  return (
    <span className="relative inline-flex [perspective:600px]">
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          className={`inline-block ${className ?? ''}`}
          initial={{ opacity: 0, rotateX: -90, y: '0.4em' }}
          animate={{ opacity: 1, rotateX: 0, y: 0 }}
          exit={{ opacity: 0, rotateX: 90, y: '-0.4em' }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

/**
 * Types and deletes through a list of phrases, with a blinking caret.
 */
export function Typewriter({
  phrases,
  className,
  typingSpeed = 70,
  deletingSpeed = 35,
  pause = 1400,
}: {
  phrases: string[]
  className?: string
  typingSpeed?: number
  deletingSpeed?: number
  pause?: number
}) {
  const [text, setText] = useState('')
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const current = phrases[phraseIndex]

    if (!deleting && text === current) {
      const t = setTimeout(() => setDeleting(true), pause)
      return () => clearTimeout(t)
    }

    if (deleting && text === '') {
      setDeleting(false)
      setPhraseIndex((i) => (i + 1) % phrases.length)
      return
    }

    const t = setTimeout(
      () =>
        setText((prev) =>
          deleting
            ? current.slice(0, prev.length - 1)
            : current.slice(0, prev.length + 1),
        ),
      deleting ? deletingSpeed : typingSpeed,
    )
    return () => clearTimeout(t)
  }, [text, deleting, phraseIndex, phrases, typingSpeed, deletingSpeed, pause])

  return (
    <span className={className}>
      {text}
      <motion.span
        aria-hidden
        className="ml-0.5 inline-block w-[2px] self-stretch bg-current align-middle"
        style={{ height: '1em' }}
        animate={{ opacity: [1, 1, 0, 0] }}
        transition={{ duration: 1, repeat: Infinity, times: [0, 0.5, 0.5, 1] }}
      />
    </span>
  )
}
