FROM node:6
MAINTAINER Lu Pa <admin@tedic.org>

ENV DEBIAN_FRONTEND noninteractive
ENV CODE /usr/src/app

RUN apt-get update \
        && apt-get install -y \
                wget \
        && apt-get clean

WORKDIR $CODE
COPY package.json .

# Copy code to conatiner volume
COPY . .
COPY docker-entrypoint.sh /

CMD ["npm","run","storyteller"]

ENTRYPOINT ["/docker-entrypoint.sh"]
