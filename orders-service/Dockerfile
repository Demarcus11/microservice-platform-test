# Use a lightweight Node.js image (CKS Best Practice)
FROM node:24-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files first (helps with caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your code
COPY . .

# The port your Order service listens on
EXPOSE 8000

# Start the application
CMD [ "node", "server.js" ]
