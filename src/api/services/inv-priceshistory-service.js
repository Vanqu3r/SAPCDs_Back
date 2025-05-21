const ztpriceshistory = require('../models/mongodb/ztpriceshistory');
const axios = require("axios");

const API_KEY = 'BO56AF48GLBDHFVR'; // Asegúrate de definir tu API key

async function PricesHistoryCrud(req) {
    const { procedure } = req.req.query;
    try {
        if (procedure === "POST") {
            const { symbol, interval, name } = req.req.query;
            try {
                // Formato correcto para el parámetro de función de Alpha Vantage
                let functionType;
                let formattedInterval = null;

                // Determinar la función correcta según el intervalo
                if (interval.toLowerCase().includes('min')) {
                    functionType = 'TIME_SERIES_INTRADAY';
                    formattedInterval = interval.toLowerCase(); // Conservamos el formato para intraday (1min, 5min, etc.)
                } else if (interval.toLowerCase() === '1d') {
                    functionType = 'TIME_SERIES_DAILY';
                } else if (interval.toLowerCase() === 'weekly') {
                    functionType = 'TIME_SERIES_WEEKLY';
                } else if (interval.toLowerCase() === 'monthly') {
                    functionType = 'TIME_SERIES_MONTHLY';
                } else {
                    throw new Error(`Intervalo no válido: ${interval}`);
                }

                // Construir URL
                let url = `https://www.alphavantage.co/query?function=${functionType}&symbol=${symbol}&outputsize=full&apikey=${API_KEY}`;

                // Añadir intervalo si es necesario
                if (formattedInterval && functionType === 'TIME_SERIES_INTRADAY') {
                    url += `&interval=${formattedInterval}`;
                }

                // Realizar la petición
                const response = await axios.get(url);

                // Extraer metadatos y datos
                const metadata = response.data['Meta Data'];

                // Determinar la clave correcta para la serie temporal
                let timeSeriesKey;
                if (functionType === 'TIME_SERIES_INTRADAY') {
                    timeSeriesKey = `Time Series (${formattedInterval})`;
                } else if (functionType === 'TIME_SERIES_DAILY') {
                    timeSeriesKey = 'Time Series (Daily)';
                } else if (functionType === 'TIME_SERIES_WEEKLY') {
                    timeSeriesKey = 'Weekly Time Series';
                } else if (functionType === 'TIME_SERIES_MONTHLY') {
                    timeSeriesKey = 'Monthly Time Series';
                }

                const timeSeries = response.data[timeSeriesKey];

                if (!timeSeries) {
                    throw new Error(`No se encontraron datos para ${symbol}`);
                }

                // Transformar datos al formato de tu esquema
                const dataPoints = [];
                for (const [date, values] of Object.entries(timeSeries)) {
                    dataPoints.push({
                        DATE: new Date(date),
                        OPEN: parseFloat(values['1. open']),
                        HIGH: parseFloat(values['2. high']),
                        LOW: parseFloat(values['3. low']),
                        CLOSE: parseFloat(values['4. close']),
                        VOLUME: parseInt(values['5. volume'])
                    });
                }

                // Obtener información adicional del metadata
                const timezone = metadata['5. Time Zone'] || metadata['6. Time Zone'] || 'US/Eastern';

                // Crear el documento para MongoDB
                const priceHistoryData = {
                    symbol: symbol,
                    name: name || symbol, // Usar el nombre si se proporciona, de lo contrario usar el símbolo
                    assetType: 'stock',
                    interval: interval.toLowerCase(),
                    timezone: timezone,
                    data: dataPoints
                };

                // Guardar o Actualizar en MongoDB 
                const result = await ztpriceshistory.findOneAndUpdate(
                    { symbol: symbol, interval: interval.toLowerCase() },
                    priceHistoryData,
                    { upsert: true, new: true }
                );

                return {
                    status: 'success',
                    message: `Datos guardados para ${symbol}`,
                    count: dataPoints.length,
                    result: JSON.parse(JSON.stringify(result)) // convierte a objeto plano JSON
                };


            } catch (error) {
                console.error("Error al obtener el histórico:", error.message);
                return {
                    status: 'error',
                    message: error.message
                };
            }
        } else if (procedure === "GET") {
            const { symbol, startDate, endDate } = req.req.query;

                //Solo buscar por el historial de la empresa, si la empresa ya esta en la base de datos
            const result = await ztpriceshistory.findOne({
                symbol: symbol,
            }).lean();

            if (!result) {
                return { status: 'error', message: 'No se encontraron datos' };
            }

            // Convertir fechas de query a objetos Date (si existen)
            const fechaInicio = startDate ? new Date(startDate) : null;
            const fechaFin = endDate ? new Date(endDate) : null;

            // Validar fechas
            if (fechaInicio && isNaN(fechaInicio)) return { status: 'error', message: 'Fecha de inicio inválida' };
            if (fechaFin && isNaN(fechaFin)) return { status: 'error', message: 'Fecha de fin inválida' };

            // Filtrar los datos
            const datosFiltrados = result.data.filter(punto => {
                const fecha = new Date(punto.DATE);
                return (!fechaInicio || fecha >= fechaInicio) && (!fechaFin || fecha <= fechaFin);
            });

            // Construir y devolver la respuesta
            return {
                symbol: result.symbol,
                interval: result.interval,
                name: result.name,
                timezone: result.timezone,
                assetType: result.assetType,
                data: datosFiltrados
            };
        }


        return {
            status: 'error',
            message: 'Procedimiento no válido'
        };
    } catch (error) {
        console.error("Error en PricesHistoryCrud:", error);
        return {
            status: 'error',
            message: error.message
        };
    }
}

module.exports = { PricesHistoryCrud };