#Imagem Base
FROM node:15
#Criar pasta de trabalho dentro da imagem
WORKDIR /apimodelos
#Copiamos a app para lá
COPY package.json /apimodelos/
COPY package-lock.json /apimodelos/
RUN npm install
COPY . /apimodelos/
#Expomos a porta que irá correr
EXPOSE 3000
#Indicamos como arrancar a aplicação

CMD [ "npm", "start" ]

