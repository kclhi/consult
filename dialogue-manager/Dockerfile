FROM node:11
# Replace with root cert.
COPY ./proxy/certs/consult.crt consult.crt
ENV user node
USER $user
WORKDIR /home/$user
COPY --chown=$user:$user package.json .
RUN npm install --only=production

COPY --chown=$user:$user . .
ENV NODE_ENV production
EXPOSE 3007
CMD ["npm", "start"]
