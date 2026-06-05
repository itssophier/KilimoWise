FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY . /usr/share/nginx/html

EXPOSE 80

CMD ["/bin/sh", "-c", "if [ -n \"$GRAPHQL_URL\" ]; then sed -i \"s|http://localhost:8080/graphql|$GRAPHQL_URL|g\" /usr/share/nginx/html/config.js; fi && exec nginx -g 'daemon off;'"]
