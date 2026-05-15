# web/Dockerfile

# Etapa 1: Construcción
FROM node:20-alpine AS builder
WORKDIR /app
# Copiar package.json (ajusta las rutas si usas un workspace en la raíz)
COPY package*.json ./
RUN npm install
COPY . .
# Construir el proyecto Vite
RUN npm run build

# Etapa 2: Servidor Web (Nginx)
FROM nginx:alpine
# Copiar los archivos construidos desde la etapa anterior
COPY --from=builder /app/dist /usr/share/nginx/html
# Copiar configuración personalizada de nginx si la tienes (opcional)
# COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]