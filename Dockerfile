FROM node:11
ENV user node
# Replace with root cert.
COPY ./proxy/certs/consult.crt consult.crt
COPY package.json /home/$user/
COPY . /home/$user/
WORKDIR /home/$user
RUN chown $user --recursive .
USER $user
RUN npm install --only=production
ENV NODE_ENV production
EXPOSE 3007
CMD ["npm", "start"]
