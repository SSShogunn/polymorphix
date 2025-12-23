FROM node:22

WORKDIR /client

COPY package.json package-lock.json* ./
RUN corepack enable && pnpm install

COPY . . 

EXPOSE 5173

CMD ["npm", "run", "dev"]