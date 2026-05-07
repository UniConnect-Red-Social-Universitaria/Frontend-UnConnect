# ── Stage 1: builder ──────────────────────────────────────────────────────────
FROM node:20 AS builder

WORKDIR /app

# Variables de entorno del frontend inyectadas en tiempo de build
ARG EXPO_PUBLIC_API_URL
ARG EXPO_PUBLIC_ALLOWED_DOMAIN
ARG EXPO_PUBLIC_GOOGLE_CLIENT_ID_EXPO
ARG EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB
ARG EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID
ARG EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS
ARG EXPO_PUBLIC_AUTH0_DOMAIN
ARG EXPO_PUBLIC_AUTH0_CLIENT_ID
ARG EXPO_PUBLIC_AUTH0_CONNECTION

ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL
ENV EXPO_PUBLIC_ALLOWED_DOMAIN=$EXPO_PUBLIC_ALLOWED_DOMAIN
ENV EXPO_PUBLIC_GOOGLE_CLIENT_ID_EXPO=$EXPO_PUBLIC_GOOGLE_CLIENT_ID_EXPO
ENV EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB=$EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB
ENV EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=$EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID
ENV EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS=$EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS
ENV EXPO_PUBLIC_AUTH0_DOMAIN=$EXPO_PUBLIC_AUTH0_DOMAIN
ENV EXPO_PUBLIC_AUTH0_CLIENT_ID=$EXPO_PUBLIC_AUTH0_CLIENT_ID
ENV EXPO_PUBLIC_AUTH0_CONNECTION=$EXPO_PUBLIC_AUTH0_CONNECTION

COPY package.json ./
COPY app/package.json ./app/
COPY web/package.json ./web/
COPY packages/api/package.json ./packages/api/
COPY packages/theme/package.json ./packages/theme/
COPY packages/ui/package.json ./packages/ui/
RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build:web

# ── Stage 2: runner ───────────────────────────────────────────────────────────
FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY app/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
