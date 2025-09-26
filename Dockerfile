FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm i

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD ["npx","next","start","-p","3000"]
