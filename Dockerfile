# Usa una imagen oficial de Node.js
FROM node:18

# Crea el directorio de la app dentro del contenedor
WORKDIR /usr/src/app

# Copia los archivos de dependencias
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia todo el código del proyecto
COPY . .

# Compila los artefactos CDS (opcional pero recomendado)
#RUN npx cds build

# Expone el puerto 4004 típico de CAP
EXPOSE 4004

# Comando para iniciar la aplicación
CMD ["npm", "start"]
