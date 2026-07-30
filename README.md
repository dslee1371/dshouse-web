# 이동수하우스 웹사이트 (Astro + Tailwind v4)

공공데이터를 활용해 생활/환경 문제를 해결하는 **이동수하우스**의 소개/서비스 웹사이트입니다.  
가볍고 빠른 정적 사이트(Static)로 제작되었고, **Astro + Tailwind v4**를 사용합니다.  
컨테이너 이미지를 **Google Cloud Run**에 배포하고, **HTTPS(443) Load Balancer**로 서비스합니다.

---

## ✨ 특징
- **Astro** 정적 빌드 → 빠른 로딩·보안·운영 간단
- **Tailwind v4** (`@tailwindcss/vite`) → CSS-first로 깔끔한 스타일
- **Formspree** 문의 폼(스팸 방지용 허니팟 `_gotcha` 탑재)
- **Docker → Cloud Run**: 표준 컨테이너 실행, 관리형 인프라
- **HTTPS(443) LB**: 글로벌 HTTPS, 관리형 인증서

---

## 🧱 기술 스택
- **Framework:** Astro
- **CSS:** Tailwind CSS v4
- **Runtime:** Node 18+ (dev), NGINX(serve)
- **Infra:** Google Cloud Run, Google HTTPS Load Balancer, Artifact Registry
- **Form:** Formspree (`xqalvjwd`)

---

## 📁 구조 (요약)
```
.
├─ src/
│  ├─ layouts/         # BaseLayout 등
│  ├─ pages/           # index, about, services, works, contact
│  ├─ styles/          # global.css
│  └─ components/      # (선택) Seo, ThemeToggle 등
├─ public/             # favicon, robots, images…
├─ astro.config.mjs
├─ package.json
├─ Dockerfile
├─ default.conf.template   # nginx 템플릿(Cloud Run의 $PORT 사용)
└─ README.md
```

---

## 🚀 로컬 개발
> Node **18+** 권장

```bash
npm install
npm run dev
# 프로덕션 빌드/미리보기
npm run build
npm run preview
```

**Tailwind v4 핵심**
- `npm i -D tailwindcss @tailwindcss/vite`
- `astro.config.mjs`:
  ```js
  import { defineConfig } from 'astro/config';
  import tailwind from '@tailwindcss/vite';
  export default defineConfig({
    vite: { plugins: [tailwind()] },
  });
  ```
- `src/styles/global.css`:
  ```css
  @import "tailwindcss";
  @theme {
    --color-primary: #0a2a6b;
    --color-accent: #47a3ff;
  }
  ```

---

## ✉️ Contact 폼(Formspree)
- **폼 ID:** `xqalvjwd`  
- `/src/pages/contact.astro`의 `action`은 이미 설정되어 있습니다.

**스팸 방지(허니팟)**
```html
<input type="text" name="_gotcha" class="hidden" tabindex="-1" autocomplete="off" />
```

**전송 테스트(정상)**
```bash
curl https://formspree.io/f/xqalvjwd \
  -H 'Accept: application/json' \
  -H 'Origin: https://www.dshouse.co.kr' \
  -F name='테스트' \
  -F email='example@example.com' \
  -F message='정상 전송 확인' \
  -F _gotcha=
```

> 메일이 오지 않으면 Formspree 대시보드의 **Recipients(수신자 인증)**, **Submissions → Spam/Inbox**, **Spam Protection(Formshield 민감도/Allowed domains)**를 확인하세요.

---

## 🐳 Docker (로컬)
```bash
docker build -t dshouse-web:latest .
docker run --rm -p 8080:8080 dshouse-web:latest
# http://localhost:8080
```

### 예원교회 `/storage` 버킷 설정

`/storage`는 브라우저가 버킷에 직접 붙지 않고, Astro 서버 API가 버킷에 접근합니다.

기존 PAR URL 방식:

```env
EDITOR_TOKEN=공유_편집_토큰
STORAGE_MODE=par
OCI_PAR_URL=https://objectstorage.../o/
```

private bucket 권장 방식, OCI Object Storage S3 호환 API:

```env
EDITOR_TOKEN=공유_편집_토큰
STORAGE_MODE=oci-s3
OCI_REGION=ap-tokyo-1
OCI_NAMESPACE=테넌시_namespace
OCI_BUCKET=버킷명
OCI_S3_ACCESS_KEY_ID=customer_secret_key_access_key
OCI_S3_SECRET_ACCESS_KEY=customer_secret_key_secret
# 필요할 때만 직접 지정
# OCI_S3_ENDPOINT=https://테넌시_namespace.compat.objectstorage.ap-tokyo-1.oraclecloud.com
```

`STORAGE_MODE=oci-s3`에서는 `OCI_PAR_URL`을 쓰지 않습니다. 버킷은 private으로 두고, 서버 컨테이너만 S3 호환 credential로 접근합니다.

**중요:** Cloud Run은 컨테이너에 `PORT` 환경변수를 주입합니다.  
`default.conf.template`에서 **`${PORT}`**로 리슨하도록 구성되어 있습니다.

`default.conf.template` (요약)
```nginx
server {
  listen ${PORT};
  root /usr/share/nginx/html;
  location = /health { return 200 'ok'; }
  location / { try_files $uri $uri/ /index.html; }
}
```

---

## ☁️ Cloud Run + HTTPS LB 배포

**사전 값**
- 프로젝트: `YOUR_PROJECT_ID` ← 배포 전 실제 ID로 바꾸기
- 리전: `asia-northeast3` (서울)
- 서비스: `dshouse-web`
- Artifact Registry: `docker-repo`
- 도메인: `dshouse.co.kr`

### 0) 공통 설정 & API 활성화
```bash
export PROJECT_ID=YOUR_PROJECT_ID
export REGION=asia-northeast3
export SERVICE=dshouse-web
export REPO=docker-repo
export DOMAIN=dshouse.co.kr

gcloud config set project $PROJECT_ID
gcloud config set run/region $REGION

gcloud services enable run.googleapis.com compute.googleapis.com \
  artifactregistry.googleapis.com cloudbuild.googleapis.com \
  certificatemanager.googleapis.com
```

### 1) 빌드 & 푸시 (Artifact Registry)
```bash
gcloud artifacts repositories create $REPO \
  --repository-format=docker --location=$REGION

export IMAGE=$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/$SERVICE:prod
gcloud builds submit --region=$REGION --tag $IMAGE
```

### 2) Cloud Run 배포
```bash
gcloud run deploy $SERVICE \
  --image $IMAGE \
  --region $REGION \
  --allow-unauthenticated \
  --ingress internal-and-cloud-load-balancing \
  --cpu=1 --memory=256Mi --max-instances=100
```

### 3) Serverless NEG(Cloud Run 연결)
```bash
gcloud compute network-endpoint-groups create ${SERVICE}-neg \
  --region=$REGION \
  --network-endpoint-type=serverless \
  --cloud-run-service=$SERVICE
```

### 4) 백엔드/URL 맵/인증서/443 포워딩
```bash
# 백엔드 서비스
gcloud compute backend-services create ${SERVICE}-be \
  --global --load-balancing-scheme=EXTERNAL_MANAGED --protocol=HTTP
gcloud compute backend-services add-backend ${SERVICE}-be \
  --global --network-endpoint-group=${SERVICE}-neg \
  --network-endpoint-group-region=$REGION

# URL 맵
gcloud compute url-maps create ${SERVICE}-urlmap --default-service=${SERVICE}-be

# SSL 인증서(관리형)
gcloud compute ssl-certificates create ${SERVICE}-cert --domains=$DOMAIN --global

# 전역 고정 IP
gcloud compute addresses create ${SERVICE}-ip --global

# HTTPS 프록시 & 443 포워딩 룰
gcloud compute target-https-proxies create ${SERVICE}-https-proxy \
  --ssl-certificates=${SERVICE}-cert --url-map=${SERVICE}-urlmap

gcloud compute forwarding-rules create ${SERVICE}-fr-https \
  --global --target-https-proxy=${SERVICE}-https-proxy --ports=443 \
  --address=$(gcloud compute addresses describe ${SERVICE}-ip --global --format="value(address)")
```

### 5) DNS 설정
도메인 DNS의 **A 레코드**를 전역 고정 IP로 지정
```
A   @    <GLOBAL_IP>
```
(원하면 `www` CNAME → @)

### 6) 상태 확인
```bash
gcloud run services describe $SERVICE --region $REGION --format="value(status.url)"
gcloud compute ssl-certificates list --filter=${SERVICE}-cert
gcloud compute forwarding-rules list --filter=${SERVICE}-fr-https
```

> **대안(간단)**: LB 없이도 `gcloud run domain-mappings create --service $SERVICE --domain $DOMAIN`로 Cloud Run에 직접 도메인 매핑 시 HTTPS 자동 관리됩니다. (WAF/다중 백엔드/전역 IP가 필요 없을 때)

---

## 🔧 트러블슈팅
- **NGINX 에러 `invalid option: " -g"`** → Dockerfile의 `CMD ["nginx", "-g", "daemon off;"]`처럼 공백 없는 `-g` 사용
- **Cloud Run 502/503** → NGINX가 `${PORT}`로 리슨하는지 확인(템플릿 적용)
- **인증서 PENDING** → DNS A레코드가 LB IP를 가리키는지 확인, 전파 후 ACTIVE
- **Formspree 미수신** → Submissions Spam 여부/Recipients 인증/Spam Protection 민감도/Allowed domains 확인

---

## 📬 문의
- 이메일: `qwer013777@gmail.com`
- 도메인: `https://www.dshouse.co.kr`
