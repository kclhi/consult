# Use the standard Nginx image from Docker Hub
FROM nginx

RUN mkdir /etc/nginx/ssl
COPY nginx.crt /etc/nginx/ssl/nginx.crt
COPY nginx.key /etc/nginx/ssl/nginx.key

COPY nginx.conf /etc/nginx/nginx.conf

# EXPOSE 8080

# Start Nginx when the container has provisioned.
CMD ["nginx", "-g", "daemon off;"]
