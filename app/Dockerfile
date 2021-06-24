# build stage
FROM node:lts-alpine as build-stage
WORKDIR /datagen
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# production stage
FROM nginx:stable-alpine as production-stage
RUN rm /etc/nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build-stage /datagen/dist /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]