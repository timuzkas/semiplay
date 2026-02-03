# Build stage
FROM oven/bun:1 as build

WORKDIR /app

# Copy dependency files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install

# Copy source
COPY . .

# Set API URL at build time (standard for Vite)
ARG VITE_API_URL=http://localhost:3001
ENV VITE_API_URL=$VITE_API_URL

# Build the app
RUN bun run build

# Production stage
FROM nginx:stable-alpine

# Copy build artifacts to nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
