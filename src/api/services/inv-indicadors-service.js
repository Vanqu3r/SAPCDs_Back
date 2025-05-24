
const axios = require("axios");
const { calculateIndicators } = require("../utils/indicadors");
const indicadors = require("../models/mongodb/indicadors");
const API_KEY = "BO56AF48GLBDHFVR"//"7NONLRJ6ARKI0BA4";//"UIDZTARCBET62W2J";

async function getIndicadors(req, res) {

  //Filtramos por estrategia
  const { strategy, } = req.req.query;
  const estrategiasValidas = ['momentum', 'general'];

  if (!estrategiasValidas.includes(strategy)) {
    return { message: "Estrategia no válida" };
  }
  if (strategy === 'momentum') {
    const { procedure } = req.req.query;
    if (procedure !== "GET") {
      return { message: "Procedimiento invalido" };
    }
    if (procedure === "GET") {
      const { symbol, interval, startDate, endDate } = req.req.query;
      const { indicators } = req.req.body;
      if (!indicators || indicators.length === 0) {
        return {
          status: "error",
          message: "No se especificaron indicadores para calcular.",
        };
      }
      /* const exite = await indicadors.findOne({
         symbol: symbol,
       }).lean();
 
       if (!exite) {*/
      const result = await checkAndCreateSymbol(symbol, interval);

      if (!result) {
        return { message: "No hay nada que procesar" }
      } else {
        // Parsear los datos para el cálculo de indicadores
        const parsedData = result.map(entry => ({
          date: new Date(entry.DATE),
          close: parseFloat(entry.CLOSE),
          high: parseFloat(entry.HIGH),
          low: parseFloat(entry.LOW),
          volume: parseFloat(entry.VOLUME),
        }));

        // Calcular indicadores con la función que tengas definida
        const dataConIndicadores = calculateIndicators(parsedData, indicators);

        /*
        // Preparar el documento a guardar en MongoDB
        const indicadorDoc = new indicadors({
          symbol: result.symbol,
          name: result.name,
          strategy: "Momentum",
          assetType: result.assetType || "stock",
          interval: result.interval,
          timezone: result.timezone || "UTC",
          data: dataConIndicadores,
        });
        // Guardar en la base de datos
        //await indicadorDoc.save();
        // Convertir fechas de query a objetos Date (si existen)
        */
        const fechaInicio = startDate ? new Date(startDate) : null;
        const fechaFin = endDate ? new Date(endDate) : null;

        // Validar fechas
        if (fechaInicio && isNaN(fechaInicio)) return { status: 'error', message: 'Fecha de inicio inválida' };
        if (fechaFin && isNaN(fechaFin)) return { status: 'error', message: 'Fecha de fin inválida' };

        // Filtrar los datos
        const datosFiltrados = dataConIndicadores.filter(punto => {
          const fecha = new Date(punto.date);
          return (!fechaInicio || fecha >= fechaInicio) && (!fechaFin || fecha <= fechaFin);
        });
        // Devolver la data procesada
        return {
          symbol: symbol,
          strategy: "Momentum",
          assetType: result.assetType || "stock",
          interval: interval,
          timezone: result.timezone || "UTC",
          data: datosFiltrados,
        };
      }
      /*} else {
        return { status: 'error', message: 'Indicadores encontrados en la base de datos' };
      }*/
    }
  }

  //para llamar por indicador en Alpha
  else if (strategy === 'general') {
    const { procedure } = req.req.query;
    if (procedure !== "GET") {
      return { message: "Procedimiento invalido" };
    }
    if (procedure === "GET") {
      const { symbol, interval, functionName, startDate, endDate } = req.req.query;

      const url = `https://www.alphavantage.co/query?function=${functionName}&symbol=${symbol}&interval=${interval}&time_period=14&series_type=close&apikey=${API_KEY}`;

      try {
        const response = await axios.get(url);
        const data = response.data;

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
        console.error(`Error al obtener ${functionName}:`, error.message);

      }
    }
  }
}


//CORREGIR
async function checkAndCreateSymbol(symbol, interval, name = symbol) {
  const apiUrl = 'http://localhost:4004/api/inv/priceshistorycrud';

  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  try {
    const getUrl = `${apiUrl}?procedure=GET&type=ALPHA&symbol=${symbol}`;
    const getResponse = await axios.post(getUrl);

    const existingItem = getResponse.data?.value?.[0];
    const dataArray = existingItem?.result?.data;

    return (dataArray)
    /*
        if (existingItem && existingItem.symbol === symbol && existingItem.data?.length > 0) {
          console.log(` El símbolo ${symbol} ya está en la base de datos.`);
          return existingItem;
        }
    
        console.log(`🔍 El símbolo ${symbol} no existe o no tiene datos. Intentando crearlo...`);
    
        const postUrl = `${apiUrl}?procedure=POST&symbol=${symbol}&interval=${interval}&name=${encodeURIComponent(name)}`;
        await axios.post(postUrl); // Dispara creación
    
        //  Reintentar hasta que tenga data real
        for (let i = 0; i < 5; i++) {
          await wait(2000); // Esperar 2 segundos
          const retryResponse = await axios.post(getUrl);
          const retryItem = retryResponse.data?.value?.[0];
          if (retryItem?.data?.length > 0) {
            //Datos ya disponibles
            return retryItem;
          }
        }
    
        throw new Error(`Datos no disponibles para ${symbol} tras varios intentos.`);
    */
  } catch (error) {
    console.error(`❌ Error al verificar o crear el símbolo ${symbol}:`, error.message);
    return null;
  }
}





module.exports = { getIndicadors };
