# web/Dockerfile

# Etapa 1: Construcción
FROM node:20-alpine AS builder
WORKDIR /app

COPY . .

RUN npm install

RUN npm --workspace @uniconnect/api-types run build

ARG VITE_API_URL
RUN VITE_API_URL=$VITE_API_URL npm run build:web

# Etapa 2: Servidor Web (Nginx)
FROM nginx:alpine


COPY --from=builder /app/web/dist /usr/share/nginx/html


EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]