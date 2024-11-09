FROM node:alpine3.19

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the code
COPY . .

# Add environment variables with defaults
ENV PORT=9000
ENV NODE_ENV=production

# Expose port
EXPOSE 9000

# Add a healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:9000/api/health || exit 1

# Add startup script
RUN echo '#!/bin/sh\n\
echo "Starting backend server..."\n\
echo "MongoDB URI: $MONGODB_URI"\n\
echo "Frontend URL: $FRONTEND_URL"\n\
echo "Port: $PORT"\n\
npm run start\n' > /app/startup.sh && \
    chmod +x /app/startup.sh

# Use the startup script
CMD ["/app/startup.sh"]