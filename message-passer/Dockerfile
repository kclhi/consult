FROM node:11
ENV user node
# Replace with root cert.
COPY ./proxy/certs/consult.crt consult.crt
USER $user
WORKDIR /home/$user
COPY --chown=$user:$user package.json .
RUN npm install --only=production
COPY --chown=$user:$user . .
COPY --chown=$user:$user bin/wait-for-it.sh wait-for-it.sh
ENV NODE_ENV production
EXPOSE 3005
CMD ["npm", "start"]
