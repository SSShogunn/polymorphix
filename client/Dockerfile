FROM node:22

WORKDIR /client

COPY package.json package-lock.json* ./
RUN corepack enable && pnpm install

COPY . . 

EXPOSE 3000

CMD ["npm", "run", "dev"]