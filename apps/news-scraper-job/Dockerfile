FROM node:20-slim

# Create app directory
WORKDIR /app

# Turborepoなどを利用していると仮定して、必要なファイルをコピー
COPY package.json ./
COPY tsconfig.json ./

# monorepoのルートからのコピーに変更
COPY . .

# Install dependencies
RUN npm install

# Build the application
RUN npm run build

# Start the application
CMD ["npm", "start"]