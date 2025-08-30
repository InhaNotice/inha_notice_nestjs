# This is file of the project INGONG
# Licensed under the MIT License.
# Copyright (c) 2025 INGONG
# For full license text, see the LICENSE file in the root directory or at
# https://opensource.org/license/mit
# Author: junho Kim
# Latest Updated Date: 2025-07-24

# Fix Node.js Image Version
FROM node:23.1.0

# Set working directory
WORKDIR /app

# Install System Packages (Minimum Installation)
RUN apt-get update && apt-get install -y --no-install-recommends vim \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Copy only package.json and lock files for npm cache optimization
COPY package.json package-lock.json ./

# Install Dependencies
RUN npm install

# Copy application code
COPY ./ ./

# Container Port Number
EXPOSE 3000

# Automatically execute the following commands when the container is executed
CMD ["npm", "run", "start:dev"]