-- =====================================================
-- Migration: 대여 상태 전환을 "시각" 기준 → "날짜" 기준으로 통일
--   - 기존: scheduled→rented 14:00 KST / rented→returned 13:00 KST (분리 실행)
--   - 변경: 자정(00:00 KST) 지나면 곧바로 날짜만 보고 하루 한 번 정리
--
--   (scheduled/rented 구분은 화면 어디서도 다르게 취급하지 않고,
--    rented→returned 전환도 클라이언트에서 날짜 기준으로 이미
--    선반영되고 있어서, DB 스케줄러도 굳이 시각을 나눌 이유가 없음.
--    안전망 성격으로 하루 한 번만 정리해주면 충분.
--
--    ※ 회원에게 안내하는 "오후 2시 대여 / 익일 오후 1시 반납" 규정 자체는
--       그대로 유지 — 여긴 내부 상태 자동화 로직만 단순화하는 것.
--
--    supabase_migration_scheduled.sql이 이미 적용되어 있어도, 안 되어 있어도
--    이 파일 하나만 실행하면 되도록 함수 정의를 포함함(둘 다 안전하게 재실행 가능).
--
-- Supabase SQL Editor에서 전체 실행
-- =====================================================

-- 0. rentals.status 에 'scheduled' 없으면 추가 (이전 마이그레이션 미적용 대비)
ALTER TABLE rentals DROP CONSTRAINT IF EXISTS rentals_status_check;
ALTER TABLE rentals ADD CONSTRAINT rentals_status_check
  CHECK (status IN ('rented', 'returned', 'scheduled'));


-- 1. 기존 cron 잡 전부 제거 (이름이 다르게 남아있는 경우까지 포함)
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname IN ('auto-rental-return', 'auto-rental-activate', 'auto-rental-daily')
   OR command LIKE '%rental%';


-- 2. 반납 처리 함수 : rented → returned (rental_date < 오늘)
CREATE OR REPLACE FUNCTION process_rental_auto_return()
RETURNS void AS $$
DECLARE
  today_kst DATE := (NOW() AT TIME ZONE 'Asia/Seoul')::DATE;
BEGIN
  UPDATE rentals
  SET status = 'returned',
      returned_at = NOW()
  WHERE status = 'rented'
    AND rental_date < today_kst;
END;
$$ LANGUAGE plpgsql;


-- 3. 대여 활성화 함수 : scheduled → rented (rental_date <= 오늘)
CREATE OR REPLACE FUNCTION process_rental_activate()
RETURNS void AS $$
DECLARE
  today_kst DATE := (NOW() AT TIME ZONE 'Asia/Seoul')::DATE;
BEGIN
  UPDATE rentals
  SET status = 'rented'
  WHERE status = 'scheduled'
    AND rental_date <= today_kst;
END;
$$ LANGUAGE plpgsql;


-- 4. 위 둘을 한 번에 묶어 실행하는 래퍼 함수
CREATE OR REPLACE FUNCTION process_rental_daily()
RETURNS void AS $$
BEGIN
  PERFORM process_rental_auto_return();
  PERFORM process_rental_activate();
END;
$$ LANGUAGE plpgsql;


-- 5. 자정 직후(00:05 KST = 전날 15:05 UTC) 하루 한 번만 실행
--    → 클라이언트 fallback(useRentals.js의 autoReturnStale)이 이미
--      날짜 기준으로 즉시 처리해주지만, 아무도 접속 안 한 채로
--      방치되는 경우를 대비한 안전망 성격
SELECT cron.schedule(
  'auto-rental-daily',
  '5 15 * * *',
  'SELECT process_rental_daily()'
);
