FROM node:16.20.1-alpine
WORKDIR /app
RUN  yarn global add pm2
COPY package.json .
COPY . .
EXPOSE 4001
CMD ["pm2-runtime", "production.yml"]
