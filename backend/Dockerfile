FROM node:22-bookworm-slim
ENV NODE_ENV=production PORT=5000 HOST=0.0.0.0 INSPECTRE_DATA_DIR=/data
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ ca-certificates aapt && command -v aapt && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force
COPY . .
RUN mkdir -p /data && chown -R node:node /app /data
USER node
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD node -e "fetch('http://127.0.0.1:5000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
