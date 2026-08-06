# QuickDine API — Express + Mongoose, run directly with tsx (no build step)
FROM node:22-alpine

WORKDIR /app

# Install deps first for better layer caching.
# NOTE: tsx is a devDependency but is the runtime here (no build step),
# so we must install dev deps too — do NOT use --omit=dev.
COPY package*.json ./
RUN npm ci

# App source
COPY . .

ENV NODE_ENV=production
EXPOSE 5000

# server.ts is executed straight through tsx (see package.json "start")
CMD ["npm", "start"]
