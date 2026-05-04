FROM node:20-alpine

WORKDIR /app

# Instalar dependencias primero (mejor caching de capas)
COPY package*.json ./
RUN npm install --omit=dev

# Copiar el resto del código
COPY . .

EXPOSE 3001

CMD ["node", "src/server.js"]