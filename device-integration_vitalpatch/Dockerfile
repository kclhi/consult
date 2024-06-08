FROM node:11
ENV user node
USER $user
WORKDIR /home/$user
COPY --chown=$user:$user package.json .
COPY --chown=$user:$user lib/messages ./lib/messages
RUN npm install --only=production
# Copy code
COPY --chown=$user:$user . .
# Later ensures SQL start can be waited for.
COPY --chown=$user:$user ./bin/wait-for-it.sh wait-for-it.sh
# Run config
ENV NODE_ENV production
EXPOSE 3008
CMD ["npm", "start"]
