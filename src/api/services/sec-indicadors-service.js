const axios = require("axios");
const { calculateIndicators } = require("../utils/indicadors");
const Indicador = require("../models/mongodb/indicadors");
const API_KEY = "7NONLRJ6ARKI0BA4";

/*async function getIndicadors(req) {
  const { procedure, type, roleid } = req.req.query;
  try {
    const { symbol, interval = "daily", indicators = "" } = req.req.query;

    if (!symbol) throw new Error("Falta el parámetro 'symbol'");

    // Llamar Alpha Vantage
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_${interval.toUpperCase()}&symbol=${symbol}&apikey=${API_KEY}&outputsize=compact`;
    const response = await axios.get(url);
    
    const rawData = response.data["Time Series (Daily)"];
    if (!rawData) throw new Error("No se pudo obtener datos de Alpha Vantage");

    const parsedData = Object.entries(rawData).map(([date, values]) => ({
      date: new Date(date),
      close: parseFloat(values["4. close"]),
      high: parseFloat(values["2. high"]),
      low: parseFloat(values["3. low"]),
      volume: parseFloat(values["5. volume"])
    })).reverse(); // De más antiguo a más nuevo

    // Calcular indicadores
    const indicArray = indicators.split(",").map(i => i.trim().toUpperCase());
 
    const dataConIndicadores = calculateIndicators(parsedData, indicArray);

    // Generar respuesta tipo Mongo
    const result = {
      _id: "ObjectId(\"...\")",
      symbol,
      name: "Momentum", 
      assetType: "stock",
      interval,
      timezone: "UTC",
      data: dataConIndicadores
    };


    const indicadorDoc = new Indicador({
      symbol,
      name: "Momentum", // Puedes hacerlo dinámico si lo deseas
      assetType: "stock",
      interval,
      timezone: "UTC",
      data: dataConIndicadores
    });

    // Guardar en MongoDB
    const saved = await indicadorDoc.save();

    return result;


  try {
    if (procedure === 'get' && type === 'all') {
      const result = await Indicador.find().lean();
      return result;
    }


  } catch (error) {
    console.error("Error en getIndicadors:", error.message);
    return { error: true, message: error.message };
  }
}*/

async function getIndicadors(req) {
  try {
    const result = await Indicador.find().lean();
    return result;
  } catch (error) {
    console.error("Error en getIndicadors:", error.message);
    return { error: true, message: error.message };
  }
}


module.exports = { getIndicadors };
