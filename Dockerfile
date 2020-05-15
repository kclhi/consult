FROM node:11
ENV user node
# Replace with root cert.
COPY consult.crt consult.crt
COPY package.json /home/$user/
COPY . /home/$user/
WORKDIR /home/$user
RUN chown $user --recursive .
USER $user
RUN npm install --only=production
# Later ensures rabbitmq start can be waited for.
COPY ./bin/wait-for-it.sh wait-for-it.sh
ENV NODE_ENV production
EXPOSE 3002
CMD ["npm", "start"]
# CMD ["npm", "run", "consume"]
