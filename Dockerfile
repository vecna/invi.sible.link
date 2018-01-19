FROM node:6
MAINTAINER Lu Pa <admin@tedic.org>

ENV DEBIAN_FRONTEND noninteractive
ENV CODE /usr/src/app

RUN apt-get update \
        && apt-get install -y \
                wget \
        && apt-get clean

WORKDIR $CODE

# Run installation
COPY package.json .
RUN npm install

# Copy code to conatiner volume
COPY . .

#CMD [ "npm", "run", "storyteller" ]
CMD [ "bash" ]
