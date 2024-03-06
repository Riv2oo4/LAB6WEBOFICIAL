FROM node:latest
WORKDIR /myblog
COPY package.json .
RUN npm install
COPY . .
CMD npm start


