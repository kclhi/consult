FROM node:11

ENV user node

COPY package.json /home/$user/
COPY . /home/$user/

WORKDIR /home/$user

RUN chown $user --recursive .

USER $user

RUN cat requirements.txt | xargs npm install

ENV NODE_ENV production
EXPOSE 3007
CMD ["npm", "start"]
