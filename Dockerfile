# استخدام نسخة خفيفة من Node.js
FROM node:22-alpine AS build

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# مرحلة الإنتاج (Production Stage)
FROM node:22-alpine AS production
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps
COPY --from=build /usr/src/app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main"]