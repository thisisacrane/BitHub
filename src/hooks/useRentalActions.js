import { supabase } from '../lib/supabase'

export function useRentalActions() {
  const createRental = async (payload) => {
    // 날짜만으로 판단 (KST 기준) — 시각은 보지 않음
    const today = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const isPast = payload.rental_date < today
    const isFuture = payload.rental_date > today

    let insertPayload = { ...payload }
    if (isPast) {
      insertPayload = { ...payload, status: 'returned', returned_at: new Date().toISOString() }
    } else if (isFuture) {
      insertPayload = { ...payload, status: 'scheduled' }
    }
    // rental_date === today → status 기본값 'rented' 유지

    const { data, error } = await supabase
      .from('rentals')
      .insert([insertPayload])
      .select()
      .single()

    if (error?.code === '23505') {
      return { data: null, error: `${insertPayload.rental_date}에 이미 대여 신청이 있어요. 다른 날짜를 선택해주세요.` }
    }

    // 과거 날짜 대여 → 장비 상태를 다시 available로 복구
    if (!error && isPast) {
      if (payload.camera_id) {
        await supabase.from('equipments').update({ status: 'available', current_rental_id: null }).eq('id', payload.camera_id)
      }
      if (payload.tripod_id) {
        await supabase.from('equipments').update({ status: 'available', current_rental_id: null }).eq('id', payload.tripod_id)
      }
    }

    return { data, error }
  }

  const returnRental = async (rentalId) => {
    const { data, error } = await supabase
      .from('rentals')
      .update({ returned_at: new Date().toISOString(), status: 'returned' })
      .eq('id', rentalId)
      .select()
      .single()
    return { data, error }
  }

  const verifyRentalPin = async (rentalId, pin) => {
    const { data: rental, error: fetchError } = await supabase
      .from('rentals')
      .select('id, pin')
      .eq('id', rentalId)
      .single()

    if (fetchError || !rental) return { valid: false, error: '대여 정보를 찾을 수 없습니다.' }
    if (rental.pin !== pin) return { valid: false, error: '비밀번호가 올바르지 않습니다.' }
    return { valid: true }
  }

  // target: 'camera' | 'tripod' | 'both'
  const deleteRental = async (rentalId, pin, target = 'both') => {
    const { data: rental, error: fetchError } = await supabase
      .from('rentals')
      .select('id, pin, status, camera_id, tripod_id')
      .eq('id', rentalId)
      .single()

    if (fetchError || !rental) return { error: '대여 정보를 찾을 수 없습니다.' }
    if (rental.pin !== pin) return { error: '비밀번호가 올바르지 않습니다.' }

    const isActive = rental.status === 'rented' || rental.status === 'scheduled'

    if (target === 'camera') {
      if (isActive && rental.camera_id) {
        await supabase.from('equipments').update({ status: 'available', current_rental_id: null }).eq('id', rental.camera_id)
      }
      const { error } = await supabase.from('rentals').update({ camera_id: null }).eq('id', rental.id)
      return { error }
    } else if (target === 'tripod') {
      if (isActive && rental.tripod_id) {
        await supabase.from('equipments').update({ status: 'available', current_rental_id: null }).eq('id', rental.tripod_id)
      }
      const { error } = await supabase.from('rentals').update({ tripod_id: null }).eq('id', rental.id)
      return { error }
    } else {
      if (isActive) {
        if (rental.camera_id) {
          await supabase.from('equipments').update({ status: 'available', current_rental_id: null }).eq('id', rental.camera_id)
        }
        if (rental.tripod_id) {
          await supabase.from('equipments').update({ status: 'available', current_rental_id: null }).eq('id', rental.tripod_id)
        }
      }
      const { error } = await supabase.from('rentals').delete().eq('id', rentalId)
      return { error }
    }
  }

  return { createRental, returnRental, verifyRentalPin, deleteRental }
}
