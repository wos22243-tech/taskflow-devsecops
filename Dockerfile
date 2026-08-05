# VULN (intentionnelle): image de base ancienne avec CVE connues -> a detecter par Trivy/Grype
FROM node:16-slim

WORKDIR /app

COPY package.json .
RUN npm install

COPY . .

# VULN (intentionnelle): execution en root, pas d'utilisateur non-privilegie defini
EXPOSE 3000

CMD ["node", "server.js"]
