FROM node:14
#Criar pasta de trabalho dentro da imagem
WORKDIR /StrapiAPI
#Copiamos a app para lá
COPY . /StrapiAPI/
RUN npm install
#Expomos a porta que irá correr
EXPOSE 1337
#Indicamos como arrancar a aplicação
CMD [ "yarn", "develop" ]