FROM node:alpine3.19

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy rest of the code
COPY . .

# Expose port
EXPOSE 9000

# Start the app directly with node (not nodemon)
CMD ["node", "app.js"]