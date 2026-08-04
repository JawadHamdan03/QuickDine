# QuickDine web — build the Vite SPA, then serve the static output with nginx.
# VITE_API_URL is baked in at BUILD time, so it is passed as a build arg.

# --- Stage 1: build ---
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# The browser talks to the backend directly, so this must be a host-reachable URL.
ARG VITE_API_URL=http://localhost:5000/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# --- Stage 2: serve ---
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
