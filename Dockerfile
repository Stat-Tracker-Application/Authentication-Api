FROM node:20-alpine AS dependencies

COPY package.json package-lock.json ./

#download dependecies
RUN npm ci

FROM dependencies AS builder

#copy scource code
COPY . .

#compile code
CMD npm run dev

FROM node:20-alpine

COPY package.json package-lock.json ./
COPY --from=dependencies /node_modules ./node_modueles
RUN npm prune --production

COPY --from=builder . .

EXPOSE 5300
CMD ["node" , "./Api/Server.js"]