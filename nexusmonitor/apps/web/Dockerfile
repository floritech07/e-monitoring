FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
RUN adduser -D -u 1000 nexus && \
    mkdir -p /var/cache/nginx && \
    chown -R nexus:nexus /var/cache/nginx /var/run /var/log/nginx

COPY --from=builder /app/dist /usr/share/nginx/html
USER 1000

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
