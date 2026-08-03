import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || '1234'

export default function Header() {
  const navigate = useNavigate()
  const [showPinModal, setShowPinModal] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem('adminUnlocked') === 'true')

  const handleLockClick = () => {
    if (unlocked) {
      navigate('/admin')
      return
    }
    setPin('')
    setError('')
    setShowPinModal(true)
  }

  const handlePinSubmit = (e) => {
    e.preventDefault()
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem('adminUnlocked', 'true')
      setUnlocked(true)
      setShowPinModal(false)
      navigate('/admin')
    } else {
      setError('PIN이 올바르지 않습니다')
      setPin('')
    }
  }

  return (
    <>
      <header className="app-header sticky top-0 z-40 bg-white border-b border-gray-100 h-14 flex items-center justify-between" style={{ paddingLeft: '24px', paddingRight: '24px' }}>
        <span
          className="header-brand-text text-lg font-bold text-gray-900 cursor-pointer"
          onClick={() => {
            const d = new Date()
            const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
            sessionStorage.setItem('selectedDate', today)
            navigate('/', { state: { resetToToday: true } })
          }}
        >
          BitHub
        </span>
        <button
          onClick={handleLockClick}
          className="header-lock-btn text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
          style={{ cursor: 'pointer' }}
          aria-label="관리자"
        >
          {unlocked ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 9.9-1.51" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          )}
        </button>
      </header>

      {showPinModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => e.target === e.currentTarget && setShowPinModal(false)}
        >
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
            <form onSubmit={handlePinSubmit}>
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
                onClick={() => setShowPinModal(false)}
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
        </div>
      )}
    </>
  )
}
