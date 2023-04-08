FROM node:18.12-alpine
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci
COPY ./src ./src
CMD ["node","./src/index.js"]