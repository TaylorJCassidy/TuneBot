FROM node:jod-alpine
ENV NODE_ENV=production
WORKDIR /tunebot
COPY package*.json ./
RUN npm ci
COPY ./src ./src
CMD ["npm", "run", "start:ci"]