FROM node:22-slim

RUN apt-get update && apt-get install -y \
  libcairo2-dev \
  libpango1.0-dev \
  libpng-dev \
  libjpeg-dev \
  libgif-dev \
  librsvg2-dev \
  pkg-config \
  python3 \
  make \
  g++ \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@10.26.1

WORKDIR /app

COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./

COPY lib/ ./lib/
COPY artifacts/discord-bot/ ./artifacts/discord-bot/

RUN pnpm install --frozen-lockfile

CMD ["pnpm", "--filter", "@workspace/discord-bot", "run", "dev"]
