# ==========================================
# 1. Build Stage
# ==========================================
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

COPY package.json package-lock.json turbo.json tsconfig.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/
COPY packages/prompts/package.json ./packages/prompts/
COPY packages/ui/package.json ./packages/ui/

RUN npm ci

COPY apps/web/ ./apps/web/
COPY packages/ ./packages/

# Compile build bundle
RUN npx turbo run build --filter=@qoom/web

# ==========================================
# 2. Server Stage (Nginx)
# ==========================================
FROM nginx:1.25-alpine AS runner

# Copy built SPA static folder
COPY --from=builder /usr/src/app/apps/web/dist /usr/share/nginx/html

# Custom hardened Nginx SPA routing server configurations
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files \$uri \$uri/ /index.html;
        
        # Hardened HTTP Security Headers
        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Content-Security-Policy "default-src 'self'; connect-src 'self' ws: wss: https://qoom.onrender.com http://localhost:3001; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; script-src 'self' 'unsafe-inline';" always;
    }
}
EOF

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
