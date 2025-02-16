FROM node:18

WORKDIR /application

COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 4000

CMD [ "npm", "start" ]