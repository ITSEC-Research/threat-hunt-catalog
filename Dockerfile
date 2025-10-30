# Use an official Node.js image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json first
# This caches the 'npm install' layer
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy the rest of your project code
# This will be overwritten by the volume mount, but it's good practice
COPY . .

# Expose the default Vite port
EXPOSE 5173

# Default command to run the development server
# We use '--' to pass args to the 'vite' command itself
# '--host 0.0.0.0' is required to access it from outside the container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
