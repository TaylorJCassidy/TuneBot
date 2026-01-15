# syntax=docker/dockerfile-upstream:master

FROM node:jod-alpine
ARG TARGETARCH
RUN echo "I'm building for $TARGETARCH"
ENV NODE_ENV=production
WORKDIR /tunebot

COPY package*.json ./
RUN npm ci
COPY ./src ./src

ENV arch=${TARGETARCH#amd64}
ENV arch=${arch:+_aarch64}
ADD --chmod=700 https://github.com/yt-dlp/yt-dlp-nightly-builds/releases/latest/download/yt-dlp_musllinux${arch} ./src/yt_dlp

CMD ["npm", "run", "start:ci"]