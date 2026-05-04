# ---------- Etapa 1: build ----------
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ---------- Etapa 2: servir con nginx ----------
FROM nginx:alpine

# Copiar build al directorio que sirve nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Configuracion personalizada (proxy a backend)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]