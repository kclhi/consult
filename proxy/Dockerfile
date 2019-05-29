FROM nginx

RUN mkdir /etc/nginx/ssl

# In swarm replace with loaded secrets: https://docs.docker.com/engine/swarm/secrets/#use-secrets-in-compose
COPY ./certs/danvers.crt /etc/nginx/ssl/danvers.crt
COPY ./certs/danvers.key /etc/nginx/ssl/danvers.key

COPY ./nginx.conf /etc/nginx/nginx.conf
COPY ./locations /etc/nginx/locations

COPY ./bin/wait-for-it.sh wait-for-it.sh

CMD ["nginx", "-g", "daemon off;"]
