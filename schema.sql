-- =====================================================
-- BitHub 카메라 대여 시스템 DB 스키마
-- Supabase SQL Editor에서 전체 실행
-- =====================================================

-- pg_trgm 확장 (이름 검색 성능 향상)
CREATE EXTENSION IF NOT EXISTS pg_trgm;


-- =====================================================
-- 1. members 테이블 (회원 자동완성용)
-- =====================================================
CREATE TABLE members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  generation INT NOT NULL,
  student_id TEXT,
  department TEXT,
  contact TEXT,
  gender TEXT,
  birth_year TEXT,
  has_camera BOOLEAN DEFAULT false,
  camera_model TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(name, generation, student_id)
);

CREATE INDEX idx_members_name ON members USING gin (name gin_trgm_ops);


-- =====================================================
-- 2. equipments 테이블 (보유 장비 목록)
-- =====================================================
CREATE TABLE equipments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('camera', 'tripod')),
  brand TEXT,
  lens_info TEXT,
  guide_text TEXT,
  image_url TEXT,
  description TEXT,
  status TEXT DEFAULT 'available'
    CHECK (status IN ('available', 'rented', 'maintenance')),
  current_rental_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- =====================================================
-- 3. rentals 테이블 (대여 기록)
-- =====================================================
CREATE TABLE rentals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  camera_id UUID REFERENCES equipments(id) ON DELETE SET NULL,
  tripod_id UUID REFERENCES equipments(id) ON DELETE SET NULL,

  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  borrower_name TEXT NOT NULL,
  borrower_generation INT NOT NULL,
  borrower_student_id TEXT,
  borrower_department TEXT,
  borrower_contact TEXT NOT NULL,

  rental_date DATE NOT NULL,
  due_date DATE NOT NULL,
  purpose TEXT NOT NULL
    CHECK (purpose IN ('regular', 'lightning', 'other')),
  purpose_detail TEXT,
  notice_confirmed BOOLEAN DEFAULT false,

  status TEXT DEFAULT 'rented'
    CHECK (status IN ('rented', 'returned')),
  rented_at TIMESTAMPTZ DEFAULT now(),
  returned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT at_least_one_item CHECK (camera_id IS NOT NULL OR tripod_id IS NOT NULL)
);

-- equipments.current_rental_id FK 추가
ALTER TABLE equipments
ADD CONSTRAINT fk_current_rental
FOREIGN KEY (current_rental_id) REFERENCES rentals(id) ON DELETE SET NULL;


-- =====================================================
-- 4. 트리거: 대여/반납 시 equipments 상태 자동 갱신
-- =====================================================

-- 대여 생성 시 → 장비 상태를 'rented'로
CREATE OR REPLACE FUNCTION on_rental_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.camera_id IS NOT NULL THEN
    UPDATE equipments
    SET status = 'rented', current_rental_id = NEW.id
    WHERE id = NEW.camera_id;
  END IF;
  IF NEW.tripod_id IS NOT NULL THEN
    UPDATE equipments
    SET status = 'rented', current_rental_id = NEW.id
    WHERE id = NEW.tripod_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_rental_insert
AFTER INSERT ON rentals
FOR EACH ROW EXECUTE FUNCTION on_rental_insert();

-- 반납 시 → 장비 상태를 'available'로 복구
CREATE OR REPLACE FUNCTION on_rental_return()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.returned_at IS NULL AND NEW.returned_at IS NOT NULL THEN
    IF NEW.camera_id IS NOT NULL THEN
      UPDATE equipments
      SET status = 'available', current_rental_id = NULL
      WHERE id = NEW.camera_id;
    END IF;
    IF NEW.tripod_id IS NOT NULL THEN
      UPDATE equipments
      SET status = 'available', current_rental_id = NULL
      WHERE id = NEW.tripod_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_rental_return
AFTER UPDATE ON rentals
FOR EACH ROW EXECUTE FUNCTION on_rental_return();


-- =====================================================
-- 5. RLS 정책 (로그인 없이 anon 키로 전체 공개)
-- =====================================================
ALTER TABLE equipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "누구나 장비 조회" ON equipments FOR SELECT USING (true);
CREATE POLICY "누구나 장비 수정" ON equipments FOR UPDATE USING (true);
CREATE POLICY "누구나 장비 추가" ON equipments FOR INSERT WITH CHECK (true);
CREATE POLICY "누구나 장비 삭제" ON equipments FOR DELETE USING (true);
CREATE POLICY "누구나 대여 조회" ON rentals FOR SELECT USING (true);
CREATE POLICY "누구나 대여 생성" ON rentals FOR INSERT WITH CHECK (true);
CREATE POLICY "누구나 대여 수정" ON rentals FOR UPDATE USING (true);
CREATE POLICY "누구나 대여 삭제" ON rentals FOR DELETE USING (true);
CREATE POLICY "누구나 회원 조회" ON members FOR SELECT USING (true);
CREATE POLICY "누구나 회원 추가" ON members FOR INSERT WITH CHECK (true);


-- =====================================================
-- 6. 초기 데이터: 빛담 실제 보유 장비
-- =====================================================
INSERT INTO equipments (name, category, brand, lens_info, guide_text) VALUES
  ('Canon 5D Mark II',     'camera', 'Canon',      '50mm 1:1.8',       '풀프레임 DSLR. 단렌즈 장착으로 인물/야간에 강함. 무거운 편'),
  ('Canon 450D (a)',       'camera', 'Canon',      '18-55mm 1:3.5-5.6','입문용 DSLR. 가볍고 조작 간단. 줌렌즈로 다양한 화각 가능'),
  ('Canon 450D (b)',       'camera', 'Canon',      '18-55mm 1:3.5-5.6','입문용 DSLR. (a)와 동일 모델'),
  ('Canon m100',           'camera', 'Canon',      '15-45mm 1:3.5-6.3','미러리스. 작고 가벼워서 휴대성 최고. 셀카 화면 지원'),
  ('Nikon D610',           'camera', 'Nikon',      '24-85mm 1:3.5-4.5','풀프레임 DSLR. 화질 우수, 풍경/야간 촬영에 적합. 무거운 편'),
  ('Sony a6000',           'camera', 'Sony',       '16-50mm 1:3.5-5.6','미러리스. 빠른 AF, 가볍고 만능. 가장 인기 많은 장비'),
  ('벤로 SS101',            'tripod', '벤로',        '최대 146cm | 1.0kg | 4kg 하중',  '소형 삼각대. 가볍고 휴대 편리. 가벼운 카메라에 적합'),
  ('호루스벤누 QZSD-999HL', 'tripod', '호루스벤누',  '최대 157cm | 1.7kg | 12kg 하중', '중형 삼각대. 안정감 좋음. 무거운 카메라도 OK'),
  ('호루스벤누 TM-5LN',     'tripod', '호루스벤누',  '최대 147cm | 780g | 8kg 하중',   '중형 삼각대. 높이 조절 범위 넓음');
