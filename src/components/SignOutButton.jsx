import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'

const css = `
.signout-btn {
  display: inline-flex; align-items: center; gap: 8px;
  background: var(--card, #fff);
  color: #101dad;
  border: 1px solid #06031a;
  padding: 12px 24px;
  border-radius: 999px;
  font-weight: 600;
  cursor: pointer;
  outline: none;
  transition: background .15s, border-color .15s, transform .15s, box-shadow .15s;
}
.signout-btn:hover {
  background: #d7d9d9;
  border-color: #03020e;
  transform: translateY(-1px);
}
.signout-btn:focus-visible,
.signout-btn:active {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, .25);
}
.signout-btn:active { transform: translateY(0); }
`

export default function SignOutButton() {
  const { logout } = useStore()
  const nav = useNavigate()
  return (
    <>
      <style>{css}</style>
      <button type="button" className="signout-btn" onClick={() => { logout(); nav('/') }}>
        <LogOut size={16} /> Sign out
      </button>
    </>
  )
}