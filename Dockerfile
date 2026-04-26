# STAGE 1: Build
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your backend code
COPY . .

# If you have a build script (like for TypeScript), uncomment the next line
# RUN npm run build

# STAGE 2: Run
FROM node:20-alpine

WORKDIR /app

# Only copy the production dependencies and built files from the builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/ .

# Expose the port your backend runs on (usually 5000 or 8080)
EXPOSE 5000

# Start the application
CMD ["npm", "start"]