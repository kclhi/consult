FROM nginx

RUN mkdir /etc/nginx/ssl
# Replace with loaded secrets: https://docs.docker.com/engine/swarm/secrets/#use-secrets-in-compose
COPY ./certs/grey.crt /etc/nginx/ssl/grey.crt
COPY ./certs/grey.key /etc/nginx/ssl/grey.key

COPY nginx.conf /etc/nginx/nginx.conf
COPY locations /etc/nginx/locations

COPY bin/wait-for-it.sh wait-for-it.sh

CMD ["nginx", "-g", "daemon off;"]
