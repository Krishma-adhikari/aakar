import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Check, CheckCheck, MessageCircle, Send } from 'lucide-react'
import { Avatar, Empty, ago, fmtTime } from '../components/ui'
import { useStore } from '../store'

// Small green dot shown on an avatar when that person is online.
const OnlineDot = () => (
  <span
    style={{
      position: 'absolute', right: 0, bottom: 0, width: 11, height: 11, borderRadius: '50%',
      background: '#22c55e', border: '2px solid var(--card, #fff)',
    }}
  />
)

const WithStatus = ({ online, children }) => (
  <span style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
    {children}
    {online && <OnlineDot />}
  </span>
)

// One grey tick = sent, two grey ticks = delivered, two blue ticks = seen.
const Ticks = ({ m }) => {
  const seen = !!m.seenAt
  const delivered = !!m.deliveredAt
  const label = seen ? 'Seen' : delivered ? 'Delivered' : 'Sent'
  const Icon = seen || delivered ? CheckCheck : Check
  return (
    <Icon
      size={14}
      aria-label={label}
      title={label}
      strokeWidth={seen ? 3 : 2}
      style={{ marginLeft: 4, verticalAlign: 'middle', color: seen ? '#4ade80' : 'currentColor', opacity: seen ? 1 : 0.6 }}
    />
  )
}

export default function Messages() {
  const { state, user, sendMessage, typing, onlineUsers = [], refreshChats, markSeen, retryMessage, unreadByConv = {} } = useStore()
  const [params, setParams] = useSearchParams()

  const convs = state.conversations
    .filter((c) => c.ownerId === user.id)
    .sort((a, b) => new Date(b.messages.at(-1)?.at || 0) - new Date(a.messages.at(-1)?.at || 0))

  const activeId = params.get('c') || convs[0]?.id
  const active = convs.find((c) => c.id === activeId)

  const [text, setText] = useState('')
  const bodyRef = useRef(null)
  const inputRef = useRef(null)

  const isOnline = (c) => {
    const id = c?.remoteUserId || c?.peer?.userId
    return !!id && onlineUsers.includes(id)
  }

  useEffect(() => {
    refreshChats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const msgCount = active?.messages.length
  const isTyping = typing[activeId]

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgCount, isTyping])

  // Tell the sender their messages were read, but only while this chat is open and the tab is visible.
  useEffect(() => {
    if (!activeId) return undefined
    const run = () => { if (document.visibilityState === 'visible') markSeen(activeId) }
    run()
    document.addEventListener('visibilitychange', run)
    window.addEventListener('focus', run)
    return () => {
      document.removeEventListener('visibilitychange', run)
      window.removeEventListener('focus', run)
    }
  }, [activeId, msgCount, markSeen])

  const send = (e) => {
    e.preventDefault()
    const msg = text.trim()
    if (!msg || !active) return

    // Clear the box first, so it empties even if sending has a problem.
    setText('')
    sendMessage(active.id, msg)

    // Keep the cursor in the box so you can type the next message.
    // To close the phone keyboard after sending, use inputRef.current?.blur() instead.
    inputRef.current?.focus()
  }

  const headerStatus = () => {
    if (isOnline(active)) return <span style={{ color: '#16a34a', fontWeight: 600 }}>Online</span>
    if (active.peer.lastSeenAt) return `Last seen ${ago(active.peer.lastSeenAt)}`
    return active.peer.subtitle
  }

  return (
    <div className="page" style={{ maxWidth: 'none', paddingBottom: 0 }}>
      <div className="card chat">
        <div className="chat-list">
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--line)' }}>
            <h3 style={{ fontSize: 20 }}>Messages</h3>
          </div>

          {convs.length === 0 && <div className="small muted" style={{ padding: 20 }}>No conversations yet.</div>}

          {convs.map((c) => {
            const last = c.messages.at(-1)
            return (
              <button key={c.id} className={`chat-item ${c.id === activeId ? 'active' : ''}`} onClick={() => setParams({ c: c.id })}>
                <WithStatus online={isOnline(c)}>
                  <Avatar p={c.peer} />
                </WithStatus>
                <div className="grow">
                  <div className="row-between">
                    <span className="small bold" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.peer.name}</span>
                    <span className="xs faint">{last && ago(last.at)}</span>
                  </div>
                  <div className="xs muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {typing[c.id] ? 'typing…' : last ? (last.from === 'me' ? 'You: ' : '') + last.text : c.peer.subtitle}
                  </div>
                </div>
                {unreadByConv[c.id] > 0 && (
                  <span
                    style={{
                      minWidth: 20, height: 20, padding: '0 6px', borderRadius: 999, flexShrink: 0,
                      background: 'var(--primary, #2563eb)', color: '#fff', fontSize: 11, fontWeight: 700,
                      display: 'grid', placeItems: 'center',
                    }}
                  >
                    {unreadByConv[c.id] > 99 ? '99+' : unreadByConv[c.id]}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {active ? (
          <div className="chat-main">
            <div className="chat-head">
              <WithStatus online={isOnline(active)}>
                <Avatar p={active.peer} />
              </WithStatus>
              <div className="grow">
                <div className="bold">{active.peer.name}</div>
                <div className="xs muted">{headerStatus()}</div>
              </div>
              <span className="badge badge-green">Verified</span>
            </div>

            <div className="chat-body" ref={bodyRef}>
              {active.messages.map((m, i) => (
                m.from === 'system'
                  ? <div key={m.rid || m.localId || i} className="context-card">{m.text}</div>
                  : (
                    <div key={m.rid || m.localId || i} className={`bubble ${m.from === 'me' ? 'me' : 'peer'}`}>
                      {m.text}
                      <span className="t">
                        {m.status === 'sending' ? 'Sending…'
                          : m.status === 'failed' ? (
                            <button
                              type="button"
                              onClick={() => retryMessage(active.id, m.localId)}
                              style={{ background: 'none', border: 0, padding: 0, color: '#fecaca', cursor: 'pointer', font: 'inherit', textDecoration: 'underline' }}
                            >
                              Not sent · Retry
                            </button>
                          )
                            : <>{fmtTime(m.at)}{m.from === 'me' && m.rid && <Ticks m={m} />}</>}
                      </span>
                    </div>
                  )
              ))}
              {typing[active.id] && <div className="typing"><span /><span /><span /></div>}
            </div>

            <form className="chat-input" onSubmit={send}>
              <input
                ref={inputRef}
                className="input"
                placeholder={`Message ${active.peer.name.split(' ')[0]}…`}
                value={text}
                onChange={(e) => setText(e.target.value)}
                style={{ borderRadius: 999 }}
              />
              <button type="submit" className="btn btn-dark" style={{ width: 44, padding: 0 }} aria-label="Send">
                <Send size={17} />
              </button>
            </form>
          </div>
        ) : (
          <div style={{ display: 'grid', placeItems: 'center' }}>
            <Empty icon={MessageCircle} title="No conversation selected" text="Start a chat from a startup, mentor or help desk post." />
          </div>
        )}
      </div>
    </div>
  )
}