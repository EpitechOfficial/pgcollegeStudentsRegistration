import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { Mail, Phone, Send, X } from 'lucide-react'
import { COLLEGE } from '../data/portal'
import SupportAgentIcon from './SupportAgentIcon'

interface ChatMessage {
  id: number
  from: 'user' | 'desk'
  text: string
  time: string
}

/* Floating widget geometry in px — the defaults reproduce the previous fixed
   bottom-right placement, so nothing moves until the student drags it. */
const LAUNCHER_SIZE = 56 // h-14 / w-14
const PANEL_WIDTH = 336 // 21rem
const PANEL_HEIGHT = 416 // 26rem
const EDGE = 16 // page gutter
const PANEL_GAP = 32 // space between launcher and panel
const DEFAULT_BOTTOM = 56 // previous bottom-14
const DRAG_THRESHOLD = 4 // px of travel before a press counts as a drag
const NUDGE_STEP = 16 // px moved per arrow-key press

interface Point {
  x: number
  y: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max))
}

function viewportSize(): { width: number; height: number } {
  if (typeof window === 'undefined') return { width: 0, height: 0 }
  return { width: window.innerWidth, height: window.innerHeight }
}

/* Bottom-right corner, matching the previous fixed placement. */
function defaultAnchor(): Point {
  if (typeof window === 'undefined') return { x: EDGE, y: EDGE }
  const gutter = window.innerWidth >= 640 ? 20 : EDGE
  return {
    x: window.innerWidth - LAUNCHER_SIZE - gutter,
    y: window.innerHeight - LAUNCHER_SIZE - DEFAULT_BOTTOM,
  }
}

function nowTime() {
  return new Date().toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 0,
  from: 'desk',
  text: `Hello! You are chatting with the ${COLLEGE.shortName} Information Unit. How can we help you today?`,
  time: '',
}

export default function SupportChat() {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE])
  const listRef = useRef<HTMLDivElement>(null)
  const replyTimer = useRef<number | null>(null)

  /* Widget position: the launcher is the anchor, the panel follows it. */
  const [anchor, setAnchor] = useState<Point>(defaultAnchor)
  const [viewport, setViewport] = useState(viewportSize)
  const [dragging, setDragging] = useState(false)
  const drag = useRef<{
    pointerId: number
    offsetX: number
    offsetY: number
    startX: number
    startY: number
    moved: boolean
  } | null>(null)
  const suppressClick = useRef(false)

  // Keep latest message in view
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, open])

  // Clear pending auto-reply on unmount
  useEffect(() => {
    return () => {
      if (replyTimer.current !== null) {
        window.clearTimeout(replyTimer.current)
      }
    }
  }, [])

  // Re-clamp the widget whenever the window changes size
  useEffect(() => {
    const handleResize = () => setViewport(viewportSize())
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  function sendMessage() {
    const text = draft.trim()
    if (!text) return

    setMessages((prev) => [
      ...prev,
      { id: prev.length, from: 'user', text, time: nowTime() },
    ])
    setDraft('')

    // Simulated Information Unit acknowledgement (no backend yet)
    replyTimer.current = window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length,
          from: 'desk',
          text: 'Message received. An Information Unit officer will respond shortly. You can also call +234 907 1871 740 (9am - 4pm).',
          time: nowTime(),
        },
      ])
    }, 1200)
  }

  /* ---------------------------------- drag --------------------------------- */

  function bounds() {
    const { width, height } = viewportSize()
    return {
      maxX: Math.max(EDGE, width - LAUNCHER_SIZE - EDGE),
      maxY: Math.max(EDGE, height - LAUNCHER_SIZE - EDGE),
    }
  }

  function beginDrag(event: ReactPointerEvent<HTMLElement>, fromLauncher = false) {
    // Never steal a press meant for a control sitting in the panel header.
    if (!fromLauncher && (event.target as HTMLElement).closest('button, a, input')) return
    if (event.button !== 0) return

    // A fresh press is never a leftover swallow from an earlier drag.
    suppressClick.current = false
    drag.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - launcher.x,
      offsetY: event.clientY - launcher.y,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function moveDrag(event: ReactPointerEvent<HTMLElement>) {
    const state = drag.current
    if (!state || state.pointerId !== event.pointerId) return

    if (!state.moved) {
      const travelled = Math.hypot(event.clientX - state.startX, event.clientY - state.startY)
      if (travelled < DRAG_THRESHOLD) return
      state.moved = true
      setDragging(true)
    }

    const { maxX, maxY } = bounds()
    setAnchor({
      x: clamp(event.clientX - state.offsetX, EDGE, maxX),
      y: clamp(event.clientY - state.offsetY, EDGE, maxY),
    })
  }

  function endDrag(event: ReactPointerEvent<HTMLElement>) {
    const state = drag.current
    if (!state || state.pointerId !== event.pointerId) return

    drag.current = null
    setDragging(false)
    // A drag ends with a click event; swallow it so the panel does not toggle.
    if (state.moved) suppressClick.current = true
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  // Keyboard equivalent of dragging, so the widget stays reachable without a mouse
  function nudgeWithKeyboard(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'Home') {
      event.preventDefault()
      setAnchor(defaultAnchor())
      return
    }

    const step = event.shiftKey ? NUDGE_STEP * 3 : NUDGE_STEP
    let dx = 0
    let dy = 0
    if (event.key === 'ArrowUp') dy = -step
    else if (event.key === 'ArrowDown') dy = step
    else if (event.key === 'ArrowLeft') dx = -step
    else if (event.key === 'ArrowRight') dx = step
    else return

    event.preventDefault()
    const { maxX, maxY } = bounds()
    setAnchor({
      x: clamp(launcher.x + dx, EDGE, maxX),
      y: clamp(launcher.y + dy, EDGE, maxY),
    })
  }

  const launcherDragProps = {
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => beginDrag(event, true),
    onPointerMove: moveDrag,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  }

  const headerDragProps = {
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => beginDrag(event),
    onPointerMove: moveDrag,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  }

  /* ------------------------------- placement ------------------------------- */

  // Clamp on read rather than on drag, so shrinking the window always brings
  // the widget back into view without losing where the student put it.
  const { maxX, maxY } = bounds()
  const launcher = {
    x: clamp(anchor.x, EDGE, maxX),
    y: clamp(anchor.y, EDGE, maxY),
  }

  const panelWidth = Math.min(PANEL_WIDTH, Math.max(0, viewport.width - EDGE * 2))
  const panelHeight = Math.min(PANEL_HEIGHT, Math.max(0, viewport.height - EDGE * 2))
  const panelLeft = clamp(
    launcher.x + LAUNCHER_SIZE - panelWidth,
    EDGE,
    Math.max(EDGE, viewport.width - panelWidth - EDGE),
  )
  const aboveLauncher = launcher.y - panelHeight - PANEL_GAP
  const panelTop = clamp(
    aboveLauncher >= EDGE ? aboveLauncher : launcher.y + LAUNCHER_SIZE + PANEL_GAP,
    EDGE,
    Math.max(EDGE, viewport.height - panelHeight - EDGE),
  )

  return (
    <>
      {/* Chat Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Support chat with the Information Unit"
          style={{ left: panelLeft, top: panelTop, width: panelWidth, height: panelHeight }}
          className="fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl shadow-[#0A2B4F]/30"
        >
          {/* Panel header — mirrors the navy header/footer card; also the drag handle */}
          <div
            {...headerDragProps}
            className={`flex touch-none items-center justify-between bg-[#0A2B4F] px-4 py-3 select-none ${
              dragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10"
                aria-hidden="true"
              >
                <SupportAgentIcon className="h-7 w-7" />
              </span>
              <div>
                <p className="text-xs font-bold text-white">Information Unit</p>
                <p className="text-2xs text-white/70">Support chat • typically replies quickly</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close support chat"
              className="rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Messages */}
          <div ref={listRef} className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-[#F5F7F9] p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.from === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    message.from === 'user'
                      ? 'rounded-br-sm bg-[#0A2B4F] text-white'
                      : 'rounded-bl-sm border border-[#E5E7EB] bg-white text-[#212529]'
                  }`}
                >
                  <p>{message.text}</p>
                  {message.time && (
                    <p
                      className={`mt-1 text-right text-2xs ${
                        message.from === 'user' ? 'text-white/60' : 'text-[#6C757D]'
                      }`}
                    >
                      {message.time}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Direct channels */}
            <div className="flex items-center gap-2 pt-1">
              <a
                href={`mailto:${COLLEGE.email}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white px-2.5 py-1 text-2xs font-medium text-[#0A2B4F] transition-colors hover:bg-[#0A2B4F]/5"
              >
                <Mail className="h-3 w-3" aria-hidden="true" />
                Email us
              </a>
              <a
                href={`tel:${COLLEGE.phone.replace(/\s/g, '')}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white px-2.5 py-1 text-2xs font-medium text-[#0A2B4F] transition-colors hover:bg-[#0A2B4F]/5"
              >
                <Phone className="h-3 w-3" aria-hidden="true" />
                Call
              </a>
            </div>
          </div>

          {/* Composer */}
          <form
            onSubmit={(event) => {
              event.preventDefault()
              sendMessage()
            }}
            className="flex items-center gap-2 border-t border-[#E5E7EB] bg-white p-3"
          >
            <input
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Type your message…"
              aria-label="Type your support message"
              className="h-9 flex-1 rounded-xl border border-[#E5E7EB] bg-[#F5F7F9] px-3 text-xs text-[#212529] transition-colors focus:border-[#0A2B4F]/40 focus:bg-white focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Send support message"
              disabled={!draft.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0A2B4F] text-white transition-all hover:bg-[#12335A] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      )}

      {/* Circular Launcher Button — draggable, defaults to the bottom right */}
      <button
        type="button"
        {...launcherDragProps}
        onKeyDown={nudgeWithKeyboard}
        onClick={() => {
          if (suppressClick.current) {
            suppressClick.current = false
            return
          }
          setOpen((prev) => !prev)
        }}
        style={{ left: launcher.x, top: launcher.y }}
        title="Drag to reposition"
        aria-label={open ? 'Close support chat' : 'Open support chat with the Information Unit'}
        aria-expanded={open}
        className={`fixed z-50 flex h-14 w-14 touch-none items-center justify-center rounded-full text-white shadow-xl transition-[color,background-color,box-shadow,transform] ${
          dragging ? 'cursor-grabbing' : 'cursor-grab hover:scale-105 active:scale-95'
        } ${open ? 'bg-[#12335A] shadow-[#0A2B4F]/40' : 'bg-[#0A2B4F] shadow-[#0A2B4F]/40'}`}
      >
        {open ? (
          <X className="h-6 w-6" aria-hidden="true" />
        ) : (
          <SupportAgentIcon className="h-9 w-9" />
        )}
        {!open && (
          <span
            className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500"
            aria-hidden="true"
          />
        )}
      </button>
    </>
  )
}
