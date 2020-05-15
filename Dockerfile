FROM node:11
ENV user node
# ~MDC Node user exists by default. RUN groupadd --system $user && useradd --system --create-home --gid $user $user
# Copy code
COPY package.json /home/$user/
COPY . /home/$user/
WORKDIR /home/$user
RUN chown $user --recursive .
USER $user
RUN npm install --only=production
# Later ensures SQL start can be waited for.
COPY ./bin/wait-for-it.sh wait-for-it.sh
# Run config
ENV NODE_ENV production
EXPOSE 3001
CMD ["npm", "start"]
