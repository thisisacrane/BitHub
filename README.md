# BitHub — 빛담 장비 대여 시스템

한양대학교 공과대학 사진동아리 **빛담**의 카메라/삼각대 대여 관리 웹 애플리케이션입니다.

---

## 주요 기능

**회원 기능**
- 카메라·삼각대 대여 신청 (회원 자동완성, 날짜 선택, PIN 설정)
- 월별 캘린더로 대여 현황 조회
- PIN 인증 후 대여 취소
- 개별 장비 상세 페이지 (렌즈 정보, 초급자 가이드 포함)

**관리자 기능**
- 장비 추가·수정·삭제 및 상태 변경
- 전체 대여 현황 조회·수정
- 회원 목록 관리
- PIN 기반 관리자 인증

---

## 기술 스택

| 구분 | 기술 |
|---|---|
| 프론트엔드 | React 19, React Router DOM 7, Tailwind CSS 4 |
| 빌드 | Vite 8 |
| 백엔드/DB | Supabase (PostgreSQL, 실시간 동기화) |
| 배포 | Vercel |
| PWA | Vite PWA Plugin (오프라인 지원, 홈화면 추가) |

---

## 프로젝트 구조

```
src/
├── pages/
│   ├── HomePage.jsx       # 메인 장비 대여 페이지
│   ├── CalendarPage.jsx   # 캘린더 조회 페이지
│   ├── AdminPage.jsx      # 관리자 페이지
│   └── CameraPage.jsx     # 개별 장비 상세 페이지
├── components/
│   ├── layout/            # Header, BottomNav
│   └── equipment/         # EquipmentCard, RentalForm, MemberSearch 등
├── hooks/
│   ├── useEquipments.js   # 장비 목록 & 실시간 동기화
│   ├── useRentals.js      # 날짜별 대여 조회
│   ├── useAllRentals.js   # 월별 대여 조회
│   ├── useMembers.js      # 회원 목록 조회
│   └── useRentalActions.js # 대여·취소·반납 로직
├── lib/
│   └── supabase.js        # Supabase 클라이언트
├── constants/
│   └── rules.js           # 대여 규칙, 목적 라벨
└── App.jsx                # 라우팅
```

---

## 로컬 개발 환경 설정

### 1. 저장소 클론

```bash
git clone https://github.com/thisisacrane/BitHub.git
cd BitHub/bithub
npm install
```

### 2. 환경변수 설정

`.env` 파일을 프로젝트 루트에 생성합니다:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ADMIN_PIN=your_admin_pin
```

> Supabase 프로젝트 URL과 anon key는 Supabase 대시보드 > Settings > API에서 확인할 수 있습니다.

### 3. 개발 서버 실행

```bash
npm run dev
```

---

## 빌드 & 배포

```bash
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 결과 로컬 미리보기
npm run lint     # ESLint 검사
```

배포는 Vercel을 통해 자동으로 이루어집니다. `main` 브랜치에 푸시하면 자동 배포됩니다.

---

## 대여 상태 규칙

시각(오후 몇 시)이 아니라 **날짜 단위**로만 판단합니다.

| 상태 | 조건 |
|---|---|
| `scheduled` (대여 예정) | 대여일이 미래 |
| `rented` (대여중) | 대여일이 당일 |
| `returned` (반납 완료) | 대여일이 지남(자정 경과) → 자동 처리 |

---

## 데이터베이스 주요 테이블

- `members` — 회원 정보 (자동완성용)
- `equipments` — 보유 장비 (camera / tripod)
- `rentals` — 대여 기록 (scheduled / rented / returned)
