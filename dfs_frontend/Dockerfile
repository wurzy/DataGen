# build stage
FROM node:16 as build-stage
WORKDIR /datagen
COPY package*.json /datagen/
RUN npm install
COPY . /datagen/
RUN npm run build

# production stage
FROM nginx:stable-alpine as production-stage
RUN rm /etc/nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build-stage /datagen/dist /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]