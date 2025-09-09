# Use the official Node.js 20 image
FROM node:20-slim

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application code
COPY . .

# Create a non-root user to run the app
RUN addgroup -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nodejs

# Switch to the nodejs user
USER nodejs

# Expose port
EXPOSE 8080

# Start the application
CMD ["node", "src/index.js"]