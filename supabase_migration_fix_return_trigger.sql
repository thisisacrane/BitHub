-- =====================================================
-- Migration: 반납 트리거가 최신 대여를 덮어쓰는 문제 수정
--
--   문제: 같은 장비를 연속된 날짜로 A, B가 각각 대여했을 때
--   (예: A=8/5, B=8/6), A가 나중에 자동 반납 처리되면
--   on_rental_return 트리거가 equipments.current_rental_id를
--   무조건 NULL로 리셋해버림 — 이미 B로 갱신돼 있어도 상관없이 지움.
--   → equipments 테이블만 보면 "아무도 안 빌려간 상태"로 보여서
--     다른 사람이 B와 겹치는 기간에 또 대여할 수 있는 구멍이 생김.
--
--   수정: 지금 이 장비의 current_rental_id가 "반납되는 그 대여"를
--   가리키고 있을 때만 리셋하도록 WHERE 조건 추가.
--   (평소처럼 한 번에 한 명만 빌리는 케이스는 결과 동일 — 조건이
--    항상 참이라서 차이 없음. A→B처럼 겹칠 때만 다르게 동작함)
--
-- Supabase SQL Editor에서 전체 실행
-- =====================================================

CREATE OR REPLACE FUNCTION on_rental_return()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.returned_at IS NULL AND NEW.returned_at IS NOT NULL THEN
    IF NEW.camera_id IS NOT NULL THEN
      UPDATE equipments
      SET status = 'available', current_rental_id = NULL
      WHERE id = NEW.camera_id AND current_rental_id = NEW.id;
    END IF;
    IF NEW.tripod_id IS NOT NULL THEN
      UPDATE equipments
      SET status = 'available', current_rental_id = NULL
      WHERE id = NEW.tripod_id AND current_rental_id = NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
