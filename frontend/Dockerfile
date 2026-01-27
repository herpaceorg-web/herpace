# Frontend Dockerfile for Cloud Run
FROM nginx:alpine

# Copy the published Blazor WASM files
COPY src/HerPace.Client/bin/Release/net8.0/publish/wwwroot /usr/share/nginx/html

# Create nginx configuration for Blazor routing
RUN echo 'server { \
    listen 8080; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Nginx runs on port 8080 by default in this config
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
