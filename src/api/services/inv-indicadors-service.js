
const axios = require("axios");
const { calculateIndicators } = require("../utils/indicadors");
const Indicador = require("../models/mongodb/indicadors");
const indicadors = require("../models/mongodb/indicadors");
const API_KEY = "BO56AF48GLBDHFVR"//"7NONLRJ6ARKI0BA4";//"UIDZTARCBET62W2J";

async function getIndicadors(req, res) {

  //Filtramos por estrategia
  const { strategy } = req.req.query;
  if (strategy === 'momentum') {
    const { procedure } = req.req.query;
    if (procedure === "POST") {
      const { symbol, interval } = req.req.query;
      const { indicators } = req.req.body;
      if (!indicators || indicators.length === 0) {
        return {
          status: "error",
          message: "No se especificaron indicadores para calcular.",
        };
      }

      const exite = await indicadors.findOne({
        symbol: symbol,
      }).lean();

      if (!exite) {
        const result = await checkAndCreateSymbol(symbol, interval);
        if (result && result.data && result.data.length > 0) {
          // Parsear los datos para el cálculo de indicadores
          const parsedData = result.data.map(entry => ({
            date: new Date(entry.DATE),
            close: parseFloat(entry.CLOSE),
            high: parseFloat(entry.HIGH),
            low: parseFloat(entry.LOW),
            volume: parseFloat(entry.VOLUME),
          })).reverse(); // Opcional, según cómo venga ordenada la data

          // Calcular indicadores con la función que tengas definida
          const dataConIndicadores = calculateIndicators(parsedData, indicators);

          // Preparar el documento a guardar en MongoDB
          const indicadorDoc = new Indicador({
            symbol: result.symbol,
            name: result.name,
            strategy: "Momentum",
            assetType: result.assetType || "stock",
            interval: result.interval,
            timezone: result.timezone || "UTC",
            data: dataConIndicadores,
          });

          // Guardar en la base de datos
          await indicadorDoc.save();

          // Devolver la data procesada
          return {
            symbol: result.symbol,
            name: result.name,
            strategy: "Momentum",
            assetType: result.assetType || "stock",
            interval: result.interval,
            timezone: result.timezone || "UTC",
            data: dataConIndicadores,
          };
        } else {
          throw new Error("No hay datos para procesar");
        }
      } else {
        return { status: 'error', message: 'Indicadores encontrados en la base de datos' };
      }
    } else if (procedure === "GET") {
      const { symbol, startDate, endDate } = req.req.query;
      const result = await indicadors.findOne({
        symbol: symbol,
      }).lean();

      if (!result) {
        return { status: 'error', message: 'No se encontraron datos del Symbolo' };
      }

      // Convertir fechas de query a objetos Date (si existen)
      const fechaInicio = startDate ? new Date(startDate) : null;
      const fechaFin = endDate ? new Date(endDate) : null;

      // Validar fechas
      if (fechaInicio && isNaN(fechaInicio)) return { status: 'error', message: 'Fecha de inicio inválida' };
      if (fechaFin && isNaN(fechaFin)) return { status: 'error', message: 'Fecha de fin inválida' };

      // Filtrar los datos
      const datosFiltrados = result.data.filter(punto => {
        const fecha = new Date(punto.date);
        return (!fechaInicio || fecha >= fechaInicio) && (!fechaFin || fecha <= fechaFin);
      });

      return {
        symbol: result.symbol,
        interval: result.interval,
        name: result.name,
        timezone: result.timezone,
        assetType: result.assetType,
        data: datosFiltrados,
      };
    }
  }

  //para llamar por indicador en Alpha
  else if (strategy === 'general') {
    const { procedure } = req.req.query;
    if (procedure === "GET") {
      const { symbol, interval, functionName, startDate, endDate } = req.req.query;

      const url = `https://www.alphavantage.co/query?function=${functionName}&symbol=${symbol}&interval=${interval}&time_period=14&series_type=close&apikey=${API_KEY}`;

      try {
        const response = await axios.get(url);
        const data = response.data;
        console.log(JSON.stringify(data, null, 2));
        // Buscar la clave que contiene los datos técnicos
        const key = Object.keys(data).find(k => k.includes('Technical Analysis'));
        const analysis = data[key];

        if (!analysis) {
          return { status: 'error', message: 'No se encontraron datos para el indicador solicitado.' };
        }

        // Convertir el análisis a un array de objetos { date, value }
        const allData = Object.entries(analysis).map(([date, valueObj]) => ({
          date,
          value: parseFloat(Object.values(valueObj)[0])
        }));

        // Filtrar por fechas si se especifican
        const filteredData = allData.filter(entry => {
          const entryDate = new Date(entry.date);
          const fromOk = startDate ? entryDate >= new Date(startDate) : true;
          const toOk = endDate ? entryDate <= new Date(endDate) : true;
          return fromOk && toOk;
        });

        return {
          indicator: functionName,
          symbol,
          count: filteredData.length,
          series: filteredData
        };


      } catch (error) {
        console.error(`❌ Error al obtener ${functionName}:`, error.message);

      }
    }
  }
}


//Verificar y retornar PH
async function checkAndCreateSymbol(symbol, interval, name = symbol) {
  const apiUrl = 'http://localhost:4004/api/inv/priceshistorycrud';

  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  try {
    const getUrl = `${apiUrl}?procedure=GET&symbol=${symbol}`;
    const getResponse = await axios.get(getUrl);
    const existingItem = getResponse.data?.value?.[0];

    if (existingItem && existingItem.symbol === symbol && existingItem.data?.length > 0) {
      console.log(`✅ El símbolo ${symbol} ya está en la base de datos.`);
      return existingItem;
    }

    console.log(`🔍 El símbolo ${symbol} no existe o no tiene datos. Intentando crearlo...`);

    const postUrl = `${apiUrl}?procedure=POST&symbol=${symbol}&interval=${interval}&name=${encodeURIComponent(name)}`;
    await axios.get(postUrl); // Dispara creación

    // 🔁 Reintentar hasta que tenga data real
    for (let i = 0; i < 5; i++) {
      await wait(2000); // Esperar 2 segundos
      const retryResponse = await axios.get(getUrl);
      const retryItem = retryResponse.data?.value?.[0];
      if (retryItem?.data?.length > 0) {
        console.log(`✅ Datos disponibles para ${symbol} tras ${i + 1} reintento(s).`);
        return retryItem;
      }
    }

    throw new Error(`Datos no disponibles para ${symbol} tras varios intentos.`);

  } catch (error) {
    console.error(`❌ Error al verificar o crear el símbolo ${symbol}:`, error.message);
    return null;
  }
}





module.exports = { getIndicadors };
