# Static-site container for the generated ABC Bank app. Served by
# nginx on the ECS task port. The orchestrator's Terraform stack
# expects this port to match var.container_port (default 3000).
FROM nginx:alpine
RUN rm -rf /usr/share/nginx/html/*
COPY . /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q -O- http://127.0.0.1:3000/ >/dev/null || exit 1
