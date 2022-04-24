FROM node:11
# Replace with root cert.
COPY consult.crt .
ENV user node
USER $user
WORKDIR /home/$user
COPY --chown=$user:$user package.json .
RUN npm install --only=production
COPY --chown=$user:$user . .
# Later ensures rabbitmq start can be waited for.
COPY --chown=$user:$user ./bin/wait-for-it.sh wait-for-it.sh
ENV NODE_ENV production
EXPOSE 3002
CMD ["npm", "start"]
# CMD ["npm", "run", "consume"]
