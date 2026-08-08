FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

FROM nginx:alpine

RUN addgroup -S app && adduser -S app -G app && \
    chown -R app:app /usr/share/nginx/html /var/cache/nginx /var/run

COPY --from=builder /app/build /usr/share/nginx/html

USER app

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
