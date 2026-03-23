# Use Node.js 20 alpine as the base image for a small footprint
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install dependencies
# Using 'npm ci' for more reliable builds in CI/CD environments
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on (defaults to 5000 in server.js)
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]
