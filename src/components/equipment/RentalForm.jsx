import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import RentalNotice from './RentalNotice'
import MemberSearch from './MemberSearch'
import { useRentalActions } from '../../hooks/useRentalActions'
import { PURPOSE_LABELS } from '../../constants/rules'

function today() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}
function tomorrow(dateStr) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

export default function RentalForm({ equipment, existingRentals = [], selectedDate, onClose, onSuccess }) {
  const { createRental } = useRentalActions()
  const isCamera = equipment.category === 'camera'

  const [manualMode, setManualMode] = useState(false)
  const [tripods, setTripods] = useState([])
  const [tripodRentals, setTripodRentals] = useState([])
  const [form, setForm] = useState({
    member_id: null,
    borrower_name: '',
    borrower_generation: '',
    borrower_student_id: '',
    borrower_department: '',
    borrower_contact: '',
    camera_id: isCamera ? equipment.id : null,
    tripod_id: !isCamera ? equipment.id : null,
    rental_date: selectedDate || today(),
    due_date: tomorrow(selectedDate || today()),
    purpose: 'regular',
    purpose_detail: '',
    notice_confirmed: false,
    pin: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // 카메라 선택 시에만 삼각대 목록 + 활성 대여 목록을 따로 불러옴
  // (equipments.current_rental_id는 연속된 날짜로 여러 건이 겹치면 최신 값만 가리켜서
  //  날짜 충돌 판단에 못 씀 — rentals를 날짜 범위로 직접 대조)
  useEffect(() => {
    if (!isCamera) return
    supabase
      .from('equipments')
      .select('id, name, status')
      .eq('category', 'tripod')
      .order('name')
      .then(({ data }) => setTripods(data || []))
    supabase
      .from('rentals')
      .select('tripod_id, rental_date, due_date, borrower_name, borrower_generation')
      .not('tripod_id', 'is', null)
      .in('status', ['rented', 'scheduled'])
      .then(({ data }) => setTripodRentals(data || []))
  }, [isCamera])

  const setField = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleMemberSelect = (member) => {
    setManualMode(false)
    setForm((prev) => ({
      ...prev,
      member_id: member.id,
      borrower_name: member.name,
      borrower_generation: member.generation,
      borrower_student_id: member.student_id || '',
      borrower_department: member.department || '',
      borrower_contact: member.contact || '',
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.borrower_name) return setError('이름을 입력해주세요.')
    if (!form.borrower_generation) return setError('기수를 입력해주세요.')
    if (!form.borrower_contact) return setError('연락처를 입력해주세요.')
    if (!form.camera_id && !form.tripod_id) return setError('장비를 최소 하나 선택해주세요.')
    if (!form.notice_confirmed) return setError('대여 유의사항을 확인해주세요.')
    if (form.purpose === 'other' && !form.purpose_detail.trim()) return setError('기타 목적을 입력해주세요.')
    if (!/^\d{4}$/.test(form.pin)) return setError('비밀번호는 숫자 4자리로 입력해주세요.')

    const conflict = existingRentals.find(
      (r) => (r.status === 'rented' || r.status === 'scheduled') && r.rental_date === form.rental_date
    )
    if (conflict) return setError(`${form.rental_date}에 이미 대여 신청이 있어요. 다른 날짜를 선택해주세요.`)

    setSubmitting(true)
    setError('')

    const payload = {
      member_id: form.member_id,
      borrower_name: form.borrower_name,
      borrower_generation: Number(form.borrower_generation),
      borrower_student_id: form.borrower_student_id || null,
      borrower_department: form.borrower_department || null,
      borrower_contact: form.borrower_contact,
      camera_id: form.camera_id,
      tripod_id: form.tripod_id,
      rental_date: form.rental_date,
      due_date: form.due_date,
      purpose: form.purpose,
      purpose_detail: form.purpose === 'other' ? form.purpose_detail : null,
      notice_confirmed: form.notice_confirmed,
      pin: form.pin,
    }

    const { error } = await createRental(payload)
    setSubmitting(false)

    if (error) {
      setError(typeof error === 'string' ? error : '대여 신청 중 오류가 발생했습니다.')
    } else {
      onSuccess()
    }
  }

  const inputStyle = {
    width: '100%',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    padding: '10px 12px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#fff',
  }

  const labelStyle = {
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '6px',
    display: 'block',
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', flexDirection: 'column',
        justifyContent: window.innerWidth >= 768 ? 'center' : 'flex-end',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        backgroundColor: '#fff',
        borderRadius: window.innerWidth >= 768 ? '20px' : '20px 20px 0 0',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '480px',
        width: '100%',
      }}>
        {/* 핸들 */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', backgroundColor: '#e5e7eb' }} />
        </div>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', margin: 0 }}>대여 신청</h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '20px', lineHeight: 1 }}>✕</button>
        </div>

        {/* 폼 스크롤 영역 */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '0 20px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* 유의사항 (항상 펼쳐서 표시) */}
          <RentalNotice />

          {/* 대여 신청일 확인 */}
          <div>
            <label style={labelStyle}>대여 신청일</label>
            <div style={{ padding: '12px 14px', backgroundColor: '#f9fafb', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: 0 }}>
                {(() => {
                  const days = ['일', '월', '화', '수', '목', '금', '토']
                  const d = new Date(form.rental_date + 'T00:00:00')
                  if (isNaN(d.getTime())) return form.rental_date
                  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`
                })()}
              </p>
            </div>
          </div>

          {/* 선택한 장비 확인 */}
          <div>
            <label style={labelStyle}>대여 장비</label>
            <div style={{ padding: '12px 14px', backgroundColor: '#f9fafb', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: 0 }}>{equipment.name}</p>
              {equipment.lens_info && (
                <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0' }}>{equipment.lens_info}</p>
              )}
            </div>
          </div>

          {/* 삼각대 추가 선택 (카메라 선택 시에만) */}
          {isCamera && tripods.length > 0 && (
            <div>
              <label style={labelStyle}>삼각대 추가 선택 <span style={{ fontWeight: '400', color: '#9ca3af' }}>(선택사항)</span></label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {tripods.map((tri) => {
                  // 신규 rental_date가 기존 대여 기간(rental_date ~ due_date) 안에 있을 때만 비활성화
                  const conflict = tripodRentals.find(
                    (r) => r.tripod_id === tri.id && r.rental_date <= form.rental_date && r.due_date > form.rental_date
                  )
                  const isRented = !!conflict
                  const isScheduled = isRented && conflict.rental_date > today()
                  const isSelected = form.tripod_id === tri.id
                  return (
                    <button
                      key={tri.id}
                      type="button"
                      disabled={isRented}
                      onClick={() => setField('tripod_id', isSelected ? null : tri.id)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: `1.5px solid ${isSelected ? '#111827' : '#e5e7eb'}`,
                        backgroundColor: isSelected ? '#f9fafb' : '#fff',
                        cursor: isRented ? 'not-allowed' : 'pointer',
                        opacity: isRented ? 0.5 : 1,
                      }}
                    >
                      <span style={{ fontSize: '13px', color: '#111827' }}>{tri.name}</span>
                      <span style={{
                        fontSize: '11px', fontWeight: '500', padding: '2px 8px', borderRadius: '9999px',
                        backgroundColor: isRented ? '#eff6ff' : isSelected ? '#111827' : '#f3f4f6',
                        color: isRented ? '#3b82f6' : isSelected ? '#fff' : '#6b7280',
                      }}>
                        {isRented ? `${isScheduled ? '대여 예정' : '대여중'} (${conflict.borrower_generation}기 ${conflict.borrower_name})` : isSelected ? '선택됨' : '선택'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* 대여자 정보 */}
          <div>
            <label style={labelStyle}>대여자 이름</label>
            {!manualMode ? (
              <MemberSearch onSelect={handleMemberSelect} onManual={() => setManualMode(true)} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input style={inputStyle} placeholder="이름" value={form.borrower_name} onChange={(e) => setField('borrower_name', e.target.value)} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input style={{ ...inputStyle, flex: 1 }} placeholder="기수 (예: 17)" value={form.borrower_generation} onChange={(e) => setField('borrower_generation', e.target.value)} />
                  <input style={{ ...inputStyle, flex: 1 }} placeholder="학번 (예: 23)" value={form.borrower_student_id} onChange={(e) => setField('borrower_student_id', e.target.value)} />
                </div>
                <input style={inputStyle} placeholder="학과" value={form.borrower_department} onChange={(e) => setField('borrower_department', e.target.value)} />
                <input style={inputStyle} placeholder="연락처 (010-0000-0000)" value={form.borrower_contact} onChange={(e) => setField('borrower_contact', e.target.value)} />
                <button type="button" onClick={() => setManualMode(false)} style={{ fontSize: '12px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
                  자동완성으로 돌아가기 →
                </button>
              </div>
            )}

            {/* 자동완성 선택 후 정보 표시 */}
            {!manualMode && form.borrower_name && (
              <div style={{ marginTop: '10px', padding: '10px 12px', backgroundColor: '#f9fafb', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                <p style={{ fontSize: '13px', color: '#111827', fontWeight: '500', margin: '0 0 2px' }}>{form.borrower_name}</p>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                  {form.borrower_generation}기 · {form.borrower_department}
                </p>
              </div>
            )}
          </div>

          {/* 대여 목적 */}
          <div>
            <label style={labelStyle}>대여 목적</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(PURPOSE_LABELS).map(([key, label]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#374151' }}>
                  <input
                    type="radio"
                    name="purpose"
                    value={key}
                    checked={form.purpose === key}
                    onChange={() => setField('purpose', key)}
                    style={{ accentColor: '#111827' }}
                  />
                  {label}
                  {key === 'regular' && (
                    <span style={{ position: 'relative', display: 'inline-flex', marginLeft: '-4px' }} className="purpose-tooltip-wrap">
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '12px', height: '12px', borderRadius: '50%',
                        border: '1px solid #9ca3af', color: '#9ca3af',
                        fontSize: '9px', cursor: 'default', lineHeight: 1, flexShrink: 0,
                      }}>?</span>
                      <span style={{
                        position: 'absolute', left: '50%', bottom: 'calc(100% + 6px)',
                        transform: 'translateX(-50%)',
                        backgroundColor: '#1f2937', color: '#f9fafb',
                        fontSize: '12px', whiteSpace: 'nowrap',
                        padding: '4px 8px', borderRadius: '6px',
                        pointerEvents: 'none', opacity: 0, transition: 'opacity 0.15s',
                      }} className="purpose-tooltip">
                        정기출사 · 연합출사 · 장기출사
                      </span>
                    </span>
                  )}
                </label>
              ))}
            </div>
            {form.purpose === 'other' && (
              <input
                style={{ ...inputStyle, marginTop: '8px' }}
                placeholder="목적을 입력해주세요"
                value={form.purpose_detail}
                onChange={(e) => setField('purpose_detail', e.target.value)}
              />
            )}
          </div>

          {/* 삭제용 비밀번호 */}
          <div>
            <label style={labelStyle}>삭제 비밀번호(숫자 4자리)</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={form.pin}
              onChange={(e) => setField('pin', e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="• • • •"
              style={{ ...inputStyle, textAlign: 'center', letterSpacing: '0.2em', fontSize: '18px' }}
            />
            <p style={{ fontSize: '12px', color: '#f97316', marginTop: '6px', lineHeight: '1.5' }}>
              ⚠️ 나중에 대여 신청을 취소할 때 필요하니 꼭 기억해두세요!
            </p>
          </div>

          {/* 유의사항 확인 */}
          <label style={{
            display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
            padding: '12px 14px', borderRadius: '10px',
            backgroundColor: form.notice_confirmed ? '#f0fdf4' : '#fff7ed',
          }}>
            <input
              type="checkbox"
              checked={form.notice_confirmed}
              onChange={(e) => setField('notice_confirmed', e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#111827', flexShrink: 0 }}
            />
            <span style={{ fontSize: '13px', fontWeight: '600', color: form.notice_confirmed ? '#15803d' : '#c2410c' }}>
              위 대여 유의사항을 모두 확인하였습니다.
            </span>
          </label>

          {/* 에러 */}
          {error && <p style={{ fontSize: '13px', color: '#ef4444', margin: 0 }}>{error}</p>}

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: '#111827',
              color: '#fff',
              fontSize: '15px',
              fontWeight: '600',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? '신청 중...' : '대여 신청'}
          </button>
        </form>
      </div>
    </div>
  )
}
