FROM node:14.19.0-alpine

WORKDIR /root

ADD . .

RUN npm ci

EXPOSE 80

CMD [ "npm", "start" ]
