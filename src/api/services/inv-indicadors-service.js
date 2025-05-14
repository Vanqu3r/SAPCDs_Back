const axios = require("axios");
const { calculateIndicators } = require("../utils/indicadors");
const Indicador = require("../models/mongodb/indicadors");
const API_KEY = "BO56AF48GLBDHFVR"//"7NONLRJ6ARKI0BA4";//"UIDZTARCBET62W2J";

// Función para obtener el nombre de la compañía usando el SYMBOL_SEARCH
async function getCompanyName(symbol) {
  try {
    const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${symbol}&apikey=${API_KEY}`;
    const response = await axios.get(url);
    console.log(response.data);
    const company = response.data.bestMatches[0]; // Obtener el primer resultado
    if (company) {
      return company["2. name"];  // Nombre de la compañía
    } else {
      throw new Error("Compañía no encontrada");
    }
  } catch (error) {
    console.log(error);
    console.error("Error al obtener el nombre de la compañía:", error.message);
    return null;
  }
}

async function getIndicadors(req) {
  const { procedure, type, roleid } = req.req.query;
  try {
    if (procedure === "POST") {
      const { symbol, interval = "daily", indicators} = req.req.query;

      if (!symbol) throw new Error("Falta el parámetro 'symbol'");

      // Llamar Alpha Vantage para obtener el nombre de la compañía
      const name = await getCompanyName(symbol); // Aquí obtenemos el nombre de la compañía
      if (!name) throw new Error("No se pudo obtener el nombre de la compañía");

      // Llamar Alpha Vantage para obtener los datos de la serie temporal
      const url = `https://www.alphavantage.co/query?function=TIME_SERIES_${interval.toUpperCase()}&symbol=${symbol}&apikey=${API_KEY}&outputsize=compact`;
      const response = await axios.get(url);

      const rawData = response.data["Time Series (Daily)"];
      if (!rawData) throw new Error("No se pudo obtener datos de Alpha Vantage");

      const parsedData = Object.entries(rawData)
        .map(([date, values]) => ({
          date: new Date(date),
          close: parseFloat(values["4. close"]),
          high: parseFloat(values["2. high"]),
          low: parseFloat(values["3. low"]),
          volume: parseFloat(values["5. volume"]),
        }))
        .reverse(); // De más antiguo a más nuevo

      // Calcular indicadores
      const indicArray = indicators.split(",").map((i) => i.trim().toUpperCase());
      const dataConIndicadores = calculateIndicators(parsedData, indicArray);

      // Generar respuesta tipo Mongo
      const result = {
        _id: 'ObjectId("...")',
        symbol,
        name, // Aquí asignamos el nombre de la compañía
        strategy: "Momentum",
        assetType: "stock",
        interval,
        timezone: "UTC",
        data: dataConIndicadores,
      };

      const indicadorDoc = new Indicador({
        symbol,
        name, // Aquí asignamos el nombre de la compañía
        strategy: "Momentum",
        assetType: "stock",
        interval,
        timezone: "UTC",
        data: dataConIndicadores,
      });

      // Guardar en MongoDB
      const saved = await indicadorDoc.save();

      return result;
    } 
    else if (procedure === "GET") {
      const result = await Indicador.find().lean();
      return result;
    }
  } catch (error) {
    console.error("Error en getIndicadors:", error);
    return { error: true, message: error.message };
  }
}

module.exports = { getIndicadors };
