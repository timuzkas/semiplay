FROM nginx:stable-alpine

# Copy the custom nginx configuration
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Copy the pre-built dist folder from your local machine to the container
COPY ./dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
