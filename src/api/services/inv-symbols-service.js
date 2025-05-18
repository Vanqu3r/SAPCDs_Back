const API_KEY = "IRRGQ7B4EPAHDVDK";
const axios = require("axios");
const csv = require('csvtojson');

async function getAllSymbols(req) {

  try {
    // se hace la peticion con Axios, pasando por parametro la key de la API y la funcion que se quiere hacer,
    //y se espera la respuesta de tipo texto
    const response = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'LISTING_STATUS',
        apikey: API_KEY
      },
      responseType: 'text'
    }); 

    // se convierte la respuesta en un objeto json
    const symbolsJson = await csv().fromString(response.data);

   // Seleccionar solo campos deseados
    const filteredData = symbolsJson.map(item => ({
      symbol: item.symbol,
      name: item.name,
      exchange: item.exchange,
      assetType : item.assetType
    }));
    
    return filteredData;
  } catch (error) {
    console.log(error);
    console.error("Error al obtener las compañías:", error.message);
    return null;
  }
};

module.exports = {
  getAllSymbols
};