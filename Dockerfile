# This is file of the project INGONG
# Licensed under the MIT License.
# Copyright (c) 2025 INGONG
# For full license text, see the LICENSE file in the root directory or at
# https://opensource.org/license/mit
# Author: Junho Kim
# Latest Updated Date: 2026-01-04

# 1) deps: install dependencies
FROM node:24.12.0-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2) build: compile NestJS
FROM node:24.12.0-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p src/config && echo '{}' > src/config/firebase-service-account.json
RUN npm run prebuild && npm run build

# 3) runner: actual execution environment
FROM node:24.12.0-slim AS runner
WORKDIR /app
ARG DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y \
    tzdata \
    locales \
    && locale-gen ko_KR.UTF-8 \
    && ln -snf /usr/share/zoneinfo/Asia/Seoul /etc/localtime \
    && echo "Asia/Seoul" > /etc/timezone \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

ENV LANG=ko_KR.UTF-8 \
    LANGUAGE=ko_KR.UTF-8 \
    LC_ALL=ko_KR.UTF-8 \
    TZ=Asia/Seoul \
    NODE_ENV=production

COPY --from=deps /app/package.json /app/package-lock.json ./
COPY --from=deps /app/node_modules ./node_modules
RUN npm prune --production 

COPY --from=build /app/assets ./assets
COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/src/main.js"]