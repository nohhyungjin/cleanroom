# 센서 데이터 대시보드

Flask + MySQL + Chart.js를 사용한 실시간 센서 데이터 대시보드입니다.

## 기능

- **실시간 센서 데이터 시각화**
- **실시간 데이터 갱신** (5초 간격으로 최신 데이터 자동 업데이트)
- **이상치 감지 및 알림 시스템**
  - CO₂ > 1000ppm: 경고 알림
  - 온도 < 18°C 또는 > 26°C: 오류 알림
  - 습도 < 30% 또는 > 50%: 경고 알림
  - PM2.5 > 35μg/m³: 정보 알림
- CO₂, 온도, 습도, PM2.5 데이터 모니터링
- 시간별 평균값 그래프
- 자동 새로고침 (30초 간격)
- 실시간 갱신 토글 기능
- 반응형 웹 디자인

## 프로젝트 구조

```
cleanroom/
├── app.py                 # Flask 실행 진입점
├── db.py                  # MySQL 연결 및 커서 관리
├── routes/
│   ├── __init__.py
│   └── sensor_routes.py   # API 라우트 정의
├── templates/
│   └── dashboard.html     # 대시보드 페이지
├── static/
│   ├── css/
│   │   └── style.css      # 대시보드 스타일
│   └── js/
│       └── dashboard.js   # Chart.js 및 API 연동 코드
├── requirements.txt
└── README.md
```

## 설치 및 실행

### 1. 의존성 설치

```bash
pip install -r requirements.txt
```

### 2. MySQL 데이터베이스 설정

MySQL에서 다음 명령어로 데이터베이스와 테이블을 생성하세요:

```sql
CREATE DATABASE sensor_project;
USE sensor_project;

CREATE TABLE sensor_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    co2_ppm FLOAT,
    temperature FLOAT,
    humidity FLOAT,
    pm1_0 FLOAT,
    pm2_5 FLOAT,
    pm10 FLOAT,
    pressure FLOAT,
    altitude FLOAT
);
```

### 3. 앱 실행

```bash
python app.py
```

### 4. 대시보드 접속

브라우저에서 `http://127.0.0.1:5000/dashboard` 또는 `http://127.0.0.1:5000/`에 접속하세요.

## API 엔드포인트

- `GET /api/latest` - 최신 1개 센서 데이터
- `GET /api/recent?n=100` - 최근 n개 센서 데이터 (기본값: 50)
- `GET /api/hourly-avg` - 1시간 단위 평균값 (최근 24시간)

## 데이터베이스 설정

`app.py` 파일에서 MySQL 연결 정보를 수정할 수 있습니다:

```python
connection = mysql.connector.connect(
    host='localhost',
    user='root',
    password='1234',
    database='sensor_project'
)
```

## 테스트 데이터 삽입

테스트를 위해 샘플 데이터를 삽입할 수 있습니다:

```sql
INSERT INTO sensor_data (co2_ppm, temperature, humidity, pm1_0, pm2_5, pm10, pressure, altitude) VALUES
(400, 22.5, 45, 10, 15, 25, 1013.25, 100),
(420, 23.1, 47, 12, 18, 28, 1012.80, 102),
(380, 21.8, 43, 8, 12, 22, 1014.10, 98);
```
