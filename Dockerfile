# STAGE 1: Build React frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Install frontend deps (scoped to frontend/ only)
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source and build
COPY frontend/ ./
RUN npm run build
# Output: /app/frontend/dist/

# STAGE 2: Build backend (your original build stage, unchanged)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your backend code
COPY . .

# Copy the built frontend from stage 1 into the backend image
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# If you have a build script (like for TypeScript), uncomment the next line
# RUN npm run build

# STAGE 3: Run (your original run stage, unchanged)
FROM node:20-alpine

WORKDIR /app

# Only copy the production dependencies and built files from the builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/ .

# Expose the port your backend runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
