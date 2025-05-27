const ztpriceshistory = require('../models/mongodb/ztpriceshistory');
const axios = require("axios");

const API_KEY = 'BO56AF48GLBDHFVR'; // API key

async function PricesHistoryCrud(req) {
    const { procedure, type } = req.req.query;
    const ProcedimientoValidas = ['GET', 'POST'];

    if (!ProcedimientoValidas.includes(procedure)) {
        return { message: " Procedimiento no válida" };
    }
    try {
        if (procedure === "POST") {
            const { symbol, interval, name } = req.req.query;
            const existe = await ztpriceshistory.findOne({
                symbol: symbol,
            }).lean();
            if (!existe) {
                const result = await getPriceHistory(symbol, "1d", name, procedure, API_KEY);
                return result;
            }
            else {
                return {
                    status: 'error',
                    message: 'PriceHistory en la base de datos'
                };
            }
        } else if (procedure === "GET" && type === 'ALPHA') {
            const { symbol, interval, name } = req.req.query;
            const result = await getPriceHistory(symbol, "1d", name, procedure, API_KEY);
            return result;
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

async function getPriceHistory(symbol, interval, name, procedure, API_KEY) {
    try {
        // Definir tipo de función de Alpha Vantage y el formato del intervalo
        let functionType;
        let formattedInterval = null;

        const lowerInterval = interval.toLowerCase();

        if (lowerInterval.includes('min')) {
            functionType = 'TIME_SERIES_INTRADAY';
            formattedInterval = lowerInterval;
        } else if (lowerInterval === '1d') {
            functionType = 'TIME_SERIES_DAILY';
        } else if (lowerInterval === 'weekly') {
            functionType = 'TIME_SERIES_WEEKLY';
        } else if (lowerInterval === 'monthly') {
            functionType = 'TIME_SERIES_MONTHLY';
        } else {
            throw new Error(`Intervalo no válido: ${interval}`);
        }

        // Construir la URL de la API
        let url = `https://www.alphavantage.co/query?function=${functionType}&symbol=${symbol}&outputsize=full&apikey=${API_KEY}`;
        if (formattedInterval && functionType === 'TIME_SERIES_INTRADAY') {
            url += `&interval=${formattedInterval}`;
        }

        // Hacer la petición a Alpha Vantage
        const response = await axios.get(url);

        // Verificar y extraer los datos relevantes
        const metadata = response.data['Meta Data'];
        let timeSeriesKey;
        switch (functionType) {
            case 'TIME_SERIES_INTRADAY':
                timeSeriesKey = `Time Series (${formattedInterval})`;
                break;
            case 'TIME_SERIES_DAILY':
                timeSeriesKey = 'Time Series (Daily)';
                break;
            case 'TIME_SERIES_WEEKLY':
                timeSeriesKey = 'Weekly Time Series';
                break;
            case 'TIME_SERIES_MONTHLY':
                timeSeriesKey = 'Monthly Time Series';
                break;
        }

        const timeSeries = response.data[timeSeriesKey];
        if (!timeSeries) {
            throw new Error(`No se encontraron datos para ${symbol}`);
        }

        // Transformar los datos al formato esperado por MongoDB
        const dataPoints = Object.entries(timeSeries).map(([date, values]) => ({
            DATE: new Date(date),
            OPEN: parseFloat(values['1. open']),
            HIGH: parseFloat(values['2. high']),
            LOW: parseFloat(values['3. low']),
            CLOSE: parseFloat(values['4. close']),
            VOLUME: parseInt(values['5. volume'])
        }));

        const timezone = metadata['5. Time Zone'] || metadata['6. Time Zone'] || 'US/Eastern';

        const priceHistoryData = {
            symbol: symbol,
            name: name || symbol,
            assetType: 'stock',
            interval: lowerInterval,
            timezone: timezone,
            data: dataPoints
        };

        let result = null;
        if (procedure === "POST") {
            result = await ztpriceshistory.findOneAndUpdate(
                { symbol: symbol, interval: lowerInterval },
                priceHistoryData,
                { upsert: true, new: true }
            );
        }

        return {
            status: 'success',
            message: `Datos guardados para ${symbol}`,
            count: dataPoints.length,
            result: priceHistoryData
        };

    } catch (error) {
        console.error("Error al obtener el histórico:", error.message);
        return {
            status: 'error',
            message: error.message
        };
    }
}

module.exports = { PricesHistoryCrud };