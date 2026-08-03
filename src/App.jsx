import { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import Header from './components/layout/Header'
import BottomNav from './components/layout/BottomNav'
import HomePage from './pages/HomePage'
import CameraPage from './pages/CameraPage'
import CalendarPage from './pages/CalendarPage'
import AdminPage from './pages/AdminPage'

const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || '1234'

function PinModal({ pin, setPin, error, setError, onSubmit, onClose }) {
  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '20px',
      padding: '28px 24px 24px',
      width: '300px',
      boxShadow: '0 24px 48px rgba(0,0,0,0.12)',
    }}>
      {/* 자물쇠 아이콘 */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
      </div>
      <p style={{ fontSize: '15px', fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: '4px' }}>관리자 확인</p>
      <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', marginBottom: '20px' }}>PIN을 입력해 주세요</p>
      <form onSubmit={onSubmit}>
        <input
          type="password"
          value={pin}
          onChange={(e) => { setPin(e.target.value); setError('') }}
          placeholder="PIN"
          autoFocus
          style={{
            width: '100%',
            border: error ? '1.5px solid #f87171' : '1.5px solid #e5e7eb',
            borderRadius: '10px',
            padding: '11px 14px',
            fontSize: '15px',
            textAlign: 'center',
            outline: 'none',
            boxSizing: 'border-box',
            color: '#111827',
            transition: 'border-color 0.15s',
          }}
        />
        {error && (
          <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '8px', textAlign: 'center' }}>{error}</p>
        )}
        <button
          type="submit"
          style={{
            width: '100%',
            marginTop: '12px',
            padding: '12px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: '#111827',
            color: '#fff',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          확인
        </button>
        <button
          type="button"
          onClick={onClose}
          style={{
            width: '100%',
            marginTop: '8px',
            padding: '11px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: 'transparent',
            color: '#9ca3af',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          취소
        </button>
      </form>
    </div>
  )
}

function DesktopSidebar() {
  const navigate = useNavigate()
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem('adminUnlocked') === 'true')
  const [showPin, setShowPin] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')

  const handleAdminClick = () => {
    if (unlocked) { navigate('/admin'); return }
    setPin(''); setPinError(''); setShowPin(true)
  }

  const handlePinSubmit = (e) => {
    e.preventDefault()
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem('adminUnlocked', 'true')
      setUnlocked(true); setShowPin(false); navigate('/admin')
    } else {
      setPinError('PIN이 올바르지 않습니다'); setPin('')
    }
  }

  const navItemStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    borderRadius: '10px',
    backgroundColor: isActive ? '#111827' : 'transparent',
    color: isActive ? '#ffffff' : '#6b7280',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.15s',
  })

  return (
    <>
      <aside
        className="desktop-sidebar"
        style={{
          width: '220px',
          flexShrink: 0,
          borderRight: '1px solid #f0ece5',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          backgroundColor: '#faf8f5',
          alignSelf: 'flex-start',
        }}
      >
        {/* 브랜드 */}
        <div
          onClick={() => {
            const d = new Date()
            const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
            sessionStorage.setItem('selectedDate', today)
            navigate('/', { state: { resetToToday: true } })
          }}
          style={{ padding: '32px 24px 24px', borderBottom: '1px solid #f0ece5', cursor: 'pointer' }}
        >
          <p style={{ fontSize: '22px', fontWeight: '800', color: '#111827', letterSpacing: '-0.5px', lineHeight: 1 }}>BitHub</p>
          <p style={{ fontSize: '11px', color: '#b8b0a6', marginTop: '6px', letterSpacing: '0.03em' }}>빛담 장비 대여 시스템</p>
        </div>

        {/* 내비게이션 */}
        <nav style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <NavLink to="/" end style={({ isActive }) => navItemStyle(isActive)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            장비
          </NavLink>
          <NavLink to="/calendar" style={({ isActive }) => navItemStyle(isActive)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            캘린더
          </NavLink>
        </nav>

        {/* Admin 링크 */}
        <div style={{ padding: '0 12px 12px' }}>
          <button
            onClick={handleAdminClick}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#9ca3af',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0ece5'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            Admin page
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>

        {/* 푸터 */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #f0ece5' }}>
          <p style={{ fontSize: '10px', color: '#c8c0b6', lineHeight: '1.8', letterSpacing: '0.02em' }}>
            빛을 담다.<br />공과대학 사진동아리 · 빛담
          </p>
          <p style={{ fontSize: '10px', color: '#d0c8be', marginTop: '6px', letterSpacing: '0.02em' }}>
            © {new Date().getFullYear()} 빛담. All rights reserved.
          </p>
        </div>
      </aside>

      {showPin && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={(e) => e.target === e.currentTarget && setShowPin(false)}
        >
          <PinModal
            pin={pin} setPin={setPin}
            error={pinError} setError={setPinError}
            onSubmit={handlePinSubmit}
            onClose={() => setShowPin(false)}
          />
        </div>
      )}
    </>
  )
}

function Layout({ children, showNav = true }) {
  return (
    <>
      <DesktopSidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        {showNav && <BottomNav />}
      </div>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><HomePage /></Layout>} />
        <Route path="/camera/:id" element={<Layout><CameraPage /></Layout>} />
        <Route path="/calendar" element={<Layout><CalendarPage /></Layout>} />
        <Route path="/admin" element={<Layout showNav={false}><AdminPage /></Layout>} />
      </Routes>
    </BrowserRouter>
  )
}
