이동수하우스 웹사이트 (Astro + Tailwind v4)

공공데이터를 활용해 생활/환경 문제를 해결하는 이동수하우스의 소개/서비스 웹사이트입니다.
가볍고 빠른 정적 사이트로 제작되었으며, Astro + Tailwind v4를 사용하고 Cloud Run(컨테이너)으로 배포합니다. 프런트 단의 HTTPS(443) Load Balancer로 접근합니다.

✨ 특징

Astro 정적 사이트: 매우 빠른 로딩·보안·운영 용이

Tailwind v4: CSS-first 방식 (@import "tailwindcss")으로 간결한 스타일 관리

폼 제출(Formspree): 스팸 방지용 허니팟(_gotcha) 포함

Docker/Cloud Run 배포: 컨테이너 표준 + GCP 관리형 런타임

HTTPS LB(443): 글로벌 HTTPS 로드 밸런서 & 관리형 인증서

🧱 기술 스택

Framework: Astro

CSS: Tailwind CSS v4 (@tailwindcss/vite)

Runtime: Node 18+ (개발), NGINX(서빙 컨테이너)

Infra: Google Cloud Run, Google HTTPS Load Balancer, Artifact Registry

Form: Formspree

📁 디렉토리 구조(요약)
.
├─ src/
│  ├─ layouts/         # BaseLayout 등
│  ├─ pages/           # index, about, services, works, contact
│  ├─ styles/          # global.css (테마 토큰/유틸)
│  └─ components/      # Seo, ThemeToggle 등 (선택)
├─ public/             # 정적 자산, favicon/robots/sitemap 등
├─ astro.config.mjs
├─ package.json
├─ Dockerfile
├─ default.conf.template   # nginx 템플릿(Cloud Run의 $PORT 사용)
└─ README.md

🚀 로컬 개발

Node 18+ 권장

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드 / 미리보기
npm run build
npm run preview


Tailwind v4 설정 요약

npm i -D tailwindcss @tailwindcss/vite

astro.config.mjs에 Vite 플러그인 등록:

import { defineConfig } from 'astro/config';
import tailwind from '@tailwindcss/vite';
export default defineConfig({
  vite: { plugins: [tailwind()] },
});


src/styles/global.css:

@import "tailwindcss";
@theme {
  --color-primary: #0a2a6b;
  --color-accent: #47a3ff;
}


레이아웃/페이지에서 import "../styles/global.css"로 불러오기

✉️ Contact 폼(Formspree)

/src/pages/contact.astro에서 action="https://formspree.io/f/<폼ID>"로 설정합니다.

스팸 방지(권장)

<!-- 봇이 채우면 스팸으로 분류됨 -->
<input type="text" name="_gotcha" class="hidden" tabindex="-1" autocomplete="off" />


전송 테스트 (정상 제출)

curl https://formspree.io/f/<폼ID> \
  -H 'Accept: application/json' \
  -H 'Origin: https://www.도메인' \
  -F name='테스트' \
  -F email='example@example.com' \
  -F message='정상 전송 확인' \
  -F _gotcha=


메일이 안 오면 Formspree 대시보드의 Recipients(수신자 인증), Spam/Inbox 탭, Spam Protection(Formshield) 민감도와 Allowed domains를 확인하세요.

🐳 Docker (로컬)
# 빌드 (프로젝트 루트)
docker build -t dshouse-web:latest .

# 실행 (기본 8080 → 컨테이너 8080)
docker run --rm -p 8080:8080 dshouse-web:latest
# http://localhost:8080


중요: Cloud Run은 컨테이너에 PORT 환경변수를 주입합니다.
default.conf.template에서 ${PORT}를 리슨하도록 설정되어 있습니다.

default.conf.template (요약)

server {
  listen ${PORT};
  root /usr/share/nginx/html;
  location = /health { return 200 'ok'; }
  location / { try_files $uri $uri/ /index.html; }
}

☁️ Cloud Run 배포 (HTTPS LB 포함)
0) 준비
export PROJECT_ID=YOUR_PROJECT_ID
export REGION=asia-northeast3
export SERVICE=dshouse-web
export REPO=docker-repo
export DOMAIN=example.com

gcloud config set project $PROJECT_ID
gcloud config set run/region $REGION

gcloud services enable run.googleapis.com \
  compute.googleapis.com artifactregistry.googleapis.com \
  cloudbuild.googleapis.com certificatemanager.googleapis.com

1) 빌드 & 푸시 (Artifact Registry)
gcloud artifacts repositories create $REPO \
  --repository-format=docker --location=$REGION

export IMAGE=$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/$SERVICE:prod
gcloud builds submit --region=$REGION --tag $IMAGE

2) Cloud Run 배포
gcloud run deploy $SERVICE \
  --image $IMAGE \
  --region $REGION \
  --allow-unauthenticated \
  --ingress internal-and-cloud-load-balancing \
  --cpu=1 --memory=256Mi --max-instances=100

3) Serverless NEG 생성 (LB 연결)
gcloud compute network-endpoint-groups create ${SERVICE}-neg \
  --region=$REGION \
  --network-endpoint-type=serverless \
  --cloud-run-service=$SERVICE

4) 백엔드/URL 맵/인증서/443 포워딩
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

5) DNS 설정

도메인 DNS A 레코드를 위 전역 IP로 지정
A @ <GLOBAL_IP>
(필요 시 www는 CNAME → @)

6) 상태 확인
gcloud run services describe $SERVICE --region $REGION --format="value(status.url)"
gcloud compute ssl-certificates list --filter=${SERVICE}-cert
gcloud compute forwarding-rules list --filter=${SERVICE}-fr-https

🔧 트러블슈팅

NGINX 에러: invalid option: " -g"
Dockerfile CMD ["nginx", "-g", "daemon off;"]처럼 공백 없는 -g 사용.

Cloud Run 502/503
컨테이너가 ${PORT}로 리슨 중인지 확인(nginx 템플릿 적용).

HTTPS 인증서 PENDING
DNS가 LB IP를 가리키고 있는지 확인(전파 후 ACTIVE 전환).

Formspree 메일 미수신
대시보드 Submissions에 기록되는지 확인 → Spam이면 Inbox로 이동,
Recipients Verified, Spam Protection(민감도/도메인) 조정, _gotcha 적용.

🧭 스크립트(예시)

package.json:

{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "lint": "eslint ."
  }
}
