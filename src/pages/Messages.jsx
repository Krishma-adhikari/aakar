import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MessageCircle, Send } from 'lucide-react'
import { Avatar, Empty, ago, fmtTime } from '../components/ui'
import { useStore } from '../store'

export default function Messages() {
  const { state, user, sendMessage, typing } = useStore()
  const [params, setParams] = useSearchParams()
  const convs = state.conversations
    .filter((c) => c.ownerId === user.id)
    .sort((a, b) => new Date(b.messages.at(-1)?.at || 0) - new Date(a.messages.at(-1)?.at || 0))
  const activeId = params.get('c') || convs[0]?.id
  const active = convs.find((c) => c.id === activeId)
  const [text, setText] = useState('')
  const bodyRef = useRef(null)

  const msgCount = active?.messages.length
  const isTyping = typing[activeId]
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgCount, isTyping])

  const send = (e) => {
    e.preventDefault()
    if (!text.trim() || !active) return
    sendMessage(active.id, text.trim())
    setText('')
  }

  return (
    <div className="page" style={{ maxWidth: 'none', paddingBottom: 0 }}>
      <div className="card chat">
        <div className="chat-list">
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--line)' }}><h3 style={{ fontSize: 20 }}>Messages</h3></div>
          {convs.length === 0 && <div className="small muted" style={{ padding: 20 }}>No conversations yet.</div>}
          {convs.map((c) => {
            const last = c.messages.at(-1)
            return (
              <button key={c.id} className={`chat-item ${c.id === activeId ? 'active' : ''}`} onClick={() => setParams({ c: c.id })}>
                <Avatar p={c.peer} />
                <div className="grow">
                  <div className="row-between"><span className="small bold" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.peer.name}</span><span className="xs faint">{last && ago(last.at)}</span></div>
                  <div className="xs muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{typing[c.id] ? 'typing…' : last ? (last.from === 'me' ? 'You: ' : '') + last.text : c.peer.subtitle}</div>
                </div>
                {last?.from === 'peer' && c.id !== activeId && <span className="dot" style={{ color: 'var(--primary)' }} />}
              </button>
            )
          })}
        </div>
        {active ? (
          <div className="chat-main">
            <div className="chat-head">
              <Avatar p={active.peer} />
              <div className="grow"><div className="bold">{active.peer.name}</div><div className="xs muted">{active.peer.subtitle}</div></div>
              <span className="badge badge-green">Verified</span>
            </div>
            <div className="chat-body" ref={bodyRef}>
              {active.messages.map((m, i) => m.from === 'system'
                ? <div key={i} className="context-card">{m.text}</div>
                : <div key={i} className={`bubble ${m.from === 'me' ? 'me' : 'peer'}`}>{m.text}<span className="t">{fmtTime(m.at)}</span></div>)}
              {typing[active.id] && <div className="typing"><span /><span /><span /></div>}
            </div>
            <form className="chat-input" onSubmit={send}>
              <input className="input" placeholder={`Message ${active.peer.name.split(' ')[0]}…`} value={text} onChange={(e) => setText(e.target.value)} style={{ borderRadius: 999 }} />
              <button className="btn btn-dark" style={{ width: 44, padding: 0 }} aria-label="Send"><Send size={17} /></button>
            </form>
          </div>
        ) : <div style={{ display: 'grid', placeItems: 'center' }}><Empty icon={MessageCircle} title="No conversation selected" text="Start a chat from a startup, mentor or help desk post." /></div>}
      </div>
    </div>
  )
}
