# Frontend Dockerfile
FROM node:20-slim

WORKDIR /app

# Install OpenSSL for Prisma and Chromium dependencies for Puppeteer
RUN apt-get update -y && apt-get install -y \
    openssl \
    chromium \
    fonts-noto fonts-noto-cjk fonts-noto-color-emoji \
    libx11-xcb1 libxcb-dri3-0 libxcomposite1 libxdamage1 \
    libxfixes3 libxrandr2 libgbm1 libasound2 libpangocairo-1.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Use system Chromium instead of bundled (saves ~280MB)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
