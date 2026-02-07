# Multi-stage Dockerfile for Next.js with Prisma + Debian Slim
# Using Debian instead of Alpine for better Prisma/OpenSSL compatibility

# 1. Install dependencies
FROM node:20-slim AS deps
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma

# Skip browser downloads to save space/time
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN npm ci

# Generate Prisma Client in deps stage with correct binaries
RUN npx prisma generate

# 2. Build the application
FROM node:20-slim AS builder
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma client already generated in deps, but regenerate to be safe
RUN npx prisma generate

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 3. Production runner
FROM node:20-slim AS runner
WORKDIR /app

# Install runtime dependencies for Prisma and Puppeteer/Chromium
# Added: dumb-init, procps, and additional chromium dependencies
RUN apt-get update && apt-get install -y \
    openssl \
    chromium \
    dumb-init \
    procps \
    fonts-liberation \
    fonts-noto-color-emoji \
    fonts-freefont-ttf \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libxshmfence1 \
    xdg-utils \
    ca-certificates \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /tmp/.chromium-crash-reports \
    && chmod 777 /tmp/.chromium-crash-reports

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
# Make Next.js listen on all interfaces (required for Puppeteer to connect)
ENV HOSTNAME=0.0.0.0
# Chromium path in Debian
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
# Disable Chromium crash reporter to avoid crashpad errors
ENV CHROME_CRASHPAD_DATABASE_URL=""

RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 nextjs

# Create writable directories for chromium
RUN mkdir -p /home/nextjs/.cache \
    && chown -R nextjs:nodejs /home/nextjs

# Copy Prisma schema and generated client + CLI for migrations
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma

# Copy public assets
COPY --from=builder /app/public ./public

# Copy standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Use dumb-init as PID 1 to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
