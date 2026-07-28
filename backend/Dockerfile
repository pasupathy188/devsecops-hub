FROM node:22-slim

WORKDIR /app

# COMPLETELY IGNORE the local package.json
# Install ONLY the specific versions we need
RUN npm init -y && \
    npm install express@4.18.2 && \
    npm install mongoose@6.12.0 && \
    npm install cors@2.8.5 && \
    npm install socket.io@4.7.2

# Copy your application code (index.js, routes, models)
COPY . .

EXPOSE 3500

CMD ["node", "index.js"]
