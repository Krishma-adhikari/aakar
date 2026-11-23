import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Check, CheckCheck, MessageCircle, MoreVertical, Send } from 'lucide-react'
import { Avatar, Empty, ago, fmtTime } from '../components/ui'
import { demoPresence, useStore } from '../store'

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

const menuItem = {
  display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none',
  border: 0, cursor: 'pointer', font: 'inherit', fontSize: 14, color: 'inherit', whiteSpace: 'nowrap',
}

// Same person = same Supabase user id (real) or same refId + name (demo).
const peerKey = (p) => p.userId || (p.refId + p.name)

export default function Messages() {
  const {
    state, user, sendMessage, typing, onlineUsers = [], refreshChats, markSeen, retryMessage,
    unreadByConv = {}, blockedIds = [], blockUser, unblockUser, deleteChat, startChat,
  } = useStore()
  const [params, setParams] = useSearchParams()

  // Only my chats, newest first.
  const convs = state.conversations
    .filter((c) => c.ownerId === user.id)
    .sort((a, b) => new Date(b.messages.at(-1)?.at || 0) - new Date(a.messages.at(-1)?.at || 0))

  // People whose chat I deleted and who have no chat with me right now: I can start a brand new chat.
  const haveChat = new Set(convs.map((c) => peerKey(c.peer)))
  const startable = (state.deletedPeers?.[user.id] || []).filter((p) => !haveChat.has(peerKey(p)))

  // No chat opens by itself: it opens only when I click one (or follow a link with ?c=).
  const activeId = params.get('c')
  const active = convs.find((c) => c.id === activeId)

  const [text, setText] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const bodyRef = useRef(null)
  const inputRef = useRef(null)
  const menuRef = useRef(null)

  // Real chats are identified by the Supabase user id, demo chats by the contact's refId.
  const isRealChat = !!(active?.remoteUserId || active?.peer?.userId)
  const peerId = active ? (isRealChat ? (active.remoteUserId || active.peer.userId) : active.peer.refId) : undefined
  const blocked = !!peerId && blockedIds.includes(peerId)

  const isOnline = (c) => {
    if (!c?.peer) return false
    const id = c.remoteUserId || c.peer.userId
    if (id) return onlineUsers.includes(id)
    return demoPresence(c.peer).online
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

  // Close the three-dot menu when switching chats or clicking anywhere else.
  useEffect(() => { setMenuOpen(false) }, [activeId])
  useEffect(() => {
    if (!menuOpen) return undefined
    const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menuOpen])

  const send = (e) => {
    e.preventDefault()
    const msg = text.trim()
    if (!msg || !active || blocked) return

    // Clear the box first, so it empties even if sending has a problem.
    setText('')
    sendMessage(active.id, msg)

    // Keep the cursor in the box so you can type the next message.
    // To close the phone keyboard after sending, use inputRef.current?.blur() instead.
    inputRef.current?.focus()
  }

  const firstName = active ? active.peer.name.split(' ')[0] : ''

  const toggleBlock = async () => {
    setMenuOpen(false)
    if (!active || !peerId) return
    if (blocked) {
      if (!window.confirm(`Unblock ${firstName}? They will be able to message you again.`)) return
      await unblockUser(peerId)
    } else {
      if (!window.confirm(`Block ${firstName}? They will not be able to send you messages.`)) return
      await blockUser(peerId)
    }
  }

  const removeChat = async () => {
    setMenuOpen(false)
    if (!active) return
    if (!window.confirm(`Delete this chat with ${active.peer.name}? It is removed for you only.`)) return
    const ok = await deleteChat(active.id)
    if (ok) setParams({})
  }

  const headerStatus = () => {
    if (isOnline(active)) return <span style={{ color: '#16a34a', fontWeight: 600 }}>Online</span>
    const seenAt = active.peer.lastSeenAt || (isRealChat ? null : demoPresence(active.peer).lastSeenAt)
    if (seenAt) return `Last seen ${ago(seenAt)}`
    return active.peer.subtitle
  }

  return (
    <div className="page" style={{ maxWidth: 'none', paddingBottom: 0 }}>
      <div className="card chat">
        <div className="chat-list">
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--line)' }}>
            <h3 style={{ fontSize: 20 }}>Messages</h3>
          </div>

          {convs.length === 0 && startable.length === 0 && <div className="small muted" style={{ padding: 20 }}>No conversations yet.</div>}

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

          {startable.length > 0 && (
            <div style={{ padding: '14px 0 6px' }}>
              <div className="xs faint bold" style={{ padding: '0 16px 6px' }}>START A NEW CHAT</div>
              {startable.map((p) => (
                <button key={peerKey(p)} className="chat-item" onClick={() => setParams({ c: startChat(p) })}>
                  <Avatar p={p} />
                  <div className="grow">
                    <div className="small bold">{p.name}</div>
                    <div className="xs muted">{p.subtitle}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
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

              <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  aria-label="More options"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((o) => !o)}
                  style={{ width: 36, height: 36, padding: 0, display: 'grid', placeItems: 'center' }}
                >
                  <MoreVertical size={18} />
                </button>
                {menuOpen && (
                  <div
                    role="menu"
                    style={{
                      position: 'absolute', right: 0, top: 'calc(100% + 4px)', zIndex: 20, minWidth: 170,
                      background: 'var(--card, #fff)', border: '1px solid var(--line, #e5e7eb)', borderRadius: 10,
                      boxShadow: '0 8px 24px rgba(0,0,0,.12)', overflow: 'hidden',
                    }}
                  >
                    <button type="button" role="menuitem" style={menuItem} onClick={toggleBlock}>
                      {blocked ? `Unblock ${firstName}` : `Block ${firstName}`}
                    </button>
                    <button type="button" role="menuitem" style={{ ...menuItem, color: '#dc2626' }} onClick={removeChat}>
                      Delete chat
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="chat-body" ref={bodyRef}>
              {active.messages.map((m, i) => (
                m.from === 'system'
                  ? <div key={m.rid || m.localId || m.id || i} className="context-card">{m.text}</div>
                  : (
                    <div key={m.rid || m.localId || m.id || i} className={`bubble ${m.from === 'me' ? 'me' : 'peer'}`}>
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
                            : <>{fmtTime(m.at)}{m.from === 'me' && (m.rid || m.id) && <Ticks m={m} />}</>}
                      </span>
                    </div>
                  )
              ))}
              {typing[active.id] && <div className="typing"><span /><span /><span /></div>}
            </div>

            {blocked ? (
              <div className="chat-input" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <span className="small muted">You blocked {active.peer.name}. Unblock to send messages.</span>
                <button type="button" className="btn btn-dark" onClick={toggleBlock}>Unblock</button>
              </div>
            ) : (
              <form className="chat-input" onSubmit={send}>
                <input
                  ref={inputRef}
                  className="input"
                  placeholder={`Message ${firstName}…`}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  style={{ borderRadius: 999 }}
                />
                <button type="submit" className="btn btn-dark" style={{ width: 44, padding: 0 }} aria-label="Send">
                  <Send size={17} />
                </button>
              </form>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', placeItems: 'center' }}>
            <Empty icon={MessageCircle} title="No conversation selected" text="Pick a chat from the list, or start one from a startup, mentor or help desk post." />
          </div>
        )}
      </div>
    </div>
  )
}