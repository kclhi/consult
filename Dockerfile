FROM node:11

ENV user node

COPY package.json /home/$user/
COPY . /home/$user/

WORKDIR /home/$user

RUN chown $user --recursive .

USER $user

RUN cat requirements.txt | xargs npm install

# Later ensures rabbitmq start can be waited for.
RUN git clone https://github.com/vishnubob/wait-for-it.git

ENV NODE_ENV production
EXPOSE 3002
CMD ["npm", "start"]
# CMD ["npm", "run", "consume"]
