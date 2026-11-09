FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package*.json ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app ./
USER node
EXPOSE 3000
CMD ["sh", "-c", "npm run start -- -H 0.0.0.0 -p ${PORT:-3000}"]
