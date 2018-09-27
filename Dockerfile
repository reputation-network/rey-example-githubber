FROM reputationnetwork/gatekeeper as gatekeeper
FROM node:8.12.0-alpine

WORKDIR /gatekeeper
COPY --from=gatekeeper / .

WORKDIR /usr/src/app
ADD package.json yarn.lock ./
RUN apk upgrade --update && apk add --no-cache git build-base python make g++
RUN yarn install
ADD . .

WORKDIR /
RUN apk upgrade --update && apk add --no-cache ruby ruby-json ruby-rake ruby-dev ruby-rdoc ruby-bundler
RUN gem install foreman
RUN echo -e "gatekeeper: cd /gatekeeper/app && node src/server.js \nweb: cd /usr/src/app && PORT=8081 yarn start" > Procfile
ENV TARGET_APP_URL=http://localhost:8081

CMD ["foreman", "start"]
