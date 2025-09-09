# Use the official Node.js 20 Alpine image for smaller size
FROM node:20-alpine

# Install any needed packages
RUN apk add --no-cache tini

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies for production
RUN npm install --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create a non-root user to run the app
RUN addgroup -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nodejs

# Change ownership of app directory
RUN chown -R nodejs:nodejs /app

# Switch to the nodejs user
USER nodejs

# Expose port
EXPOSE 8080

# Use tini to handle signals properly
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application
CMD ["node", "src/index.js"]