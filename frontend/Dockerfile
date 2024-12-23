# frontend/Dockerfile
# Use Node.js LTS version
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install

# Copy project files
COPY . .

# Remove any existing .next folder
RUN rm -rf .next

# Build the application
RUN yarn build

# Expose port 3000
EXPOSE 3000

# Start the development server
CMD ["yarn", "dev"]