const Simulation = require('../models/mongodb/simulations');
const axios = require('axios');
require('dotenv').config();//para usar el .env despues
const API_KEY = 'BO56AF48GLBDHFVR';

async function SimulateMomentum(req) {
    const { SYMBOL, STARTDATE, ENDDATE, AMOUNT, USERID, SPECS } = req || {};
    console.log(req);
    //GENERAR ID pa' la estrategia
    const idStrategy = (symbol, usuario) => {
        const date = new Date();
        const timestamp = date.toISOString().slice(0, 10);
        const user = usuario[0];
        return `${symbol}-${timestamp}-${user}`;
    };
    //Datos Estaticos para la respuesta
    const SIMULATIONID = idStrategy(SYMBOL, USERID);
    const SIMULATIONNAME = "Estrategia de Momentum";
    const STRATEGYID = "MOM";
    console.log(SIMULATIONID);
    // Validación del body.
    const missingParams = [];
    if (!SYMBOL) missingParams.push("SYMBOL");
    if (!STARTDATE) missingParams.push("STARTDATE");
    if (!ENDDATE) missingParams.push("ENDDATE");
    if (AMOUNT === undefined || !AMOUNT) missingParams.push("AMOUNT");
    if (!USERID) missingParams.push("USERID");
    if (missingParams.length > 0) {
        return {
            message: `FALTAN PARÁMETROS REQUERIDOS: ${missingParams.join(", ")}.`
        };
    }
    // ||||||| <---Usos de la API :v Traer PriceHistory DESCOMENTAR DESPUES
    /* const APIURL = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${SYMBOL}&outputsize=full&apikey=${API_KEY}`;
     const response = await axios.get(APIURL);
     const data = response.data["Time Series (Daily)"]; // objeto por fechas
      const parsedData = Object.entries(data).map(([date, values]) => ({
        DATE: date,
        OPEN: parseFloat(values["1. open"]),
        HIGH: parseFloat(values["2. high"]),
        LOW: parseFloat(values["3. low"]),
        CLOSE: parseFloat(values["4. close"]),
        VOLUME: parseFloat(values["5. volume"])
    }));
    */
    //PRICEHISTORY DE LA BD XD
    const apiUrl = 'http://localhost:4004/api/inv/priceshistorycrud';
    const getUrl = `${apiUrl}?procedure=GET&symbol=${SYMBOL}`;
    const getResponse = await axios.post(getUrl);
    const parsedData = getResponse.data?.value?.[0].data;
    //console.log(parsedData);
    //FIN DE MI MARRANADA


    //filtrar por fecha
    function filtrarPorFecha(data, startDate, endDate) {
        return data.filter(item => {
            return item.DATE >= startDate && item.DATE <= endDate;
        });
    }
    function calculateEMA(data, period, key = "CLOSE") {
        const k = 2 / (period + 1);
        let emaArray = [];
        let emaPrev = data.slice(0, period).reduce((sum, d) => sum + d[key], 0) / period; // SMA inicial

        for (let i = 0; i < data.length; i++) {
            if (i < period - 1) {
                emaArray.push(null); // no hay suficiente data
            } else if (i === period - 1) {
                emaArray.push(emaPrev);
            } else {
                const price = data[i][key];
                emaPrev = price * k + emaPrev * (1 - k);
                emaArray.push(emaPrev);
            }
        }
        return emaArray;
    }

    function calculateRSI(data, period, key = "CLOSE") {
        let gains = [];
        let losses = [];
        let rsiArray = [];

        for (let i = 1; i < data.length; i++) {
            const change = data[i][key] - data[i - 1][key];
            gains.push(change > 0 ? change : 0);
            losses.push(change < 0 ? -change : 0);
        }

        let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
        let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

        rsiArray = Array(period).fill(null); // Sin RSI para primeros periodos

        for (let i = period; i < gains.length; i++) {
            avgGain = (avgGain * (period - 1) + gains[i]) / period;
            avgLoss = (avgLoss * (period - 1) + losses[i]) / period;

            if (avgLoss === 0) {
                rsiArray.push(100);
            } else {
                const rs = avgGain / avgLoss;
                const rsi = 100 - (100 / (1 + rs));
                rsiArray.push(rsi);
            }
        }

        // rsiArray se calcula desde el índice 1, pero la longitud debe coincidir con data
        rsiArray.unshift(null); // Ajustamos para que sea la misma longitud que data
        return rsiArray;
    }

    function calculateADX(data, period, keyHigh = "HIGH", keyLow = "LOW", keyClose = "CLOSE") {
        // Implementación simplificada de ADX

        let tr = [];
        let plusDM = [];
        let minusDM = [];

        for (let i = 1; i < data.length; i++) {
            const high = data[i][keyHigh];
            const low = data[i][keyLow];
            const prevHigh = data[i - 1][keyHigh];
            const prevLow = data[i - 1][keyLow];
            const prevClose = data[i - 1][keyClose];

            const highLow = high - low;
            const highPrevClose = Math.abs(high - prevClose);
            const lowPrevClose = Math.abs(low - prevClose);
            const trueRange = Math.max(highLow, highPrevClose, lowPrevClose);
            tr.push(trueRange);

            const upMove = high - prevHigh;
            const downMove = prevLow - low;

            plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
            minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
        }

        // Wilder's smoothing
        function smooth(values, period) {
            let smoothed = [];
            let sum = values.slice(0, period).reduce((a, b) => a + b, 0);
            smoothed[period - 1] = sum;
            for (let i = period; i < values.length; i++) {
                smoothed[i] = smoothed[i - 1] - (smoothed[i - 1] / period) + values[i];
            }
            return smoothed;
        }

        const smoothedTR = smooth(tr, period);
        const smoothedPlusDM = smooth(plusDM, period);
        const smoothedMinusDM = smooth(minusDM, period);

        let plusDI = [];
        let minusDI = [];
        let dx = [];

        for (let i = period - 1; i < smoothedTR.length; i++) {
            plusDI[i] = (smoothedPlusDM[i] / smoothedTR[i]) * 100;
            minusDI[i] = (smoothedMinusDM[i] / smoothedTR[i]) * 100;
            dx[i] = (Math.abs(plusDI[i] - minusDI[i]) / (plusDI[i] + minusDI[i])) * 100;
        }

        let adx = [];
        // Primer ADX es promedio de primeros periodos DX
        let initialADX = dx.slice(period, period * 2 - 1).reduce((a, b) => a + b, 0) / period;
        for (let i = 0; i < period * 2 - 1; i++) adx.push(null);
        adx.push(initialADX);

        for (let i = period * 2; i < dx.length; i++) {
            const val = (adx[adx.length - 1] * (period - 1) + dx[i]) / period;
            adx.push(val);
        }

        // Ajustar longitud para que coincida con data.length
        while (adx.length < data.length) adx.unshift(null);

        return adx;
    }

    function CalcularIndicadores(parsedData, SPECS) {
        // Valores por defecto si faltan o no tienen VALUE
        const defaults = {
            LONG: 21,
            SHORT: 50,
            RSI: 14,
            ADX: 14
        };

        // Construir mapa validando VALUE y usando default si no está o es inválido
        const specMap = SPECS.reduce((acc, curr) => {
            const ind = curr.INDICATOR;
            const val = (typeof curr.VALUE === "number" && !isNaN(curr.VALUE)) ? curr.VALUE : defaults[ind];
            acc[ind] = val !== undefined ? val : defaults[ind];
            return acc;
        }, {});
        //Validacion si falto algun indicador
        const emaShortPeriod = specMap["SHORT"] || defaults.SHORT;
        const emaLongPeriod = specMap["LONG"] || defaults.LONG;
        const rsiPeriod = specMap["RSI"] || defaults.RSI;
        const adxPeriod = specMap["ADX"] || defaults.ADX;
        parsedData.sort((a, b) => new Date(a.DATE) - new Date(b.DATE));
        //se calculan los indicadores
        const emaShort = calculateEMA(parsedData, emaShortPeriod);
        const emaLong = calculateEMA(parsedData, emaLongPeriod);
        const rsi = calculateRSI(parsedData, rsiPeriod);
        const adx = calculateADX(parsedData, adxPeriod);

        return parsedData.map((item, i) => ({
            DATE: item.DATE,
            SHORT: emaShort[i],
            LONG: emaLong[i],
            RSI: rsi[i],
            ADX: adx[i],
        }));
    }
    //Calcular los indicadores con todo el historico pq require fechas atras y q hueva filtrar chido
    const calculoIndicadores = CalcularIndicadores(parsedData, SPECS);
    //Los indicadores filtrados por fechas indicadoresFiltrados
    const indicadoresFiltrados = filtrarPorFecha(calculoIndicadores, STARTDATE, ENDDATE);
    //El priceHistory filtrado por fecha priceHistoryFiltrado
    const priceHistoryFiltrado = filtrarPorFecha(parsedData, STARTDATE, ENDDATE);
    //console.log(indicadoresFiltrados);
    //console.log(priceHistoryFiltrado);

    function simularEstrategiaTrading(indicadoresFiltrados, historialPreciosFiltrado, capitalInicial) {
        const señales = [];
        let capital = capitalInicial;
        let acciones = 0;

        for (let i = 1; i < indicadoresFiltrados.length; i++) {
            const anterior = indicadoresFiltrados[i - 1];
            const actual = indicadoresFiltrados[i];

            const precioDia = historialPreciosFiltrado.find(
                precio => new Date(precio.DATE).toISOString().slice(0, 10) === new Date(actual.DATE).toISOString().slice(0, 10)
            );
            if (!precioDia) continue;

            const precioCierre = precioDia.CLOSE;
            const adxSuficiente = actual.ADX > 20;
            const mediaCortaAnterior = anterior.SHORT;
            const mediaLargaAnterior = anterior.LONG;
            const mediaCortaActual = actual.SHORT;
            const mediaLargaActual = actual.LONG;

            let señalGenerada = false;

            if (adxSuficiente) {
                // Señal de compra (golden cross)
                if (mediaCortaAnterior < mediaLargaAnterior && mediaCortaActual > mediaLargaActual && capital > 0) {
                    const accionesAComprar = +(capital / precioCierre).toFixed(6);
                    acciones += accionesAComprar;
                    señales.push({
                        DATE: actual.DATE,
                        TYPE: "compra",
                        PRICE: precioCierre,
                        REASONING: "Golden Cross: la media corta cruzó por encima de la media larga",
                        SHARES: accionesAComprar
                    });
                    capital = 0;
                    señalGenerada = true;
                }
                // Señal de venta (death cross)
                else if (mediaCortaAnterior > mediaLargaAnterior && mediaCortaActual < mediaLargaActual && acciones > 0) {
                    const ventaCapital = +(acciones * precioCierre).toFixed(2);
                    señales.push({
                        DATE: actual.DATE,
                        TYPE: "venta",
                        PRICE: precioCierre,
                        REASONING: "Death Cross: la media corta cruzó por debajo de la media larga",
                        SHARES: acciones
                    });
                    capital += ventaCapital;
                    acciones = 0;
                    señalGenerada = true;
                }
            }

            if (!señalGenerada) {
                señales.push({
                    DATE: actual.DATE,
                    TYPE: "",
                    PRICE: precioCierre,
                    REASONING: "Ningún cruce detectado o condiciones no favorables, mantener posición",
                    SHARES: 0
                });
            }
        }

        return {
            SEÑALES: señales,
            RESULTADO_FINAL: {
                CAPITAL_FINAL: +capital.toFixed(2),
                ACCIONES_RESTANTES: +acciones.toFixed(6),
                VALOR_TOTAL: +(capital + acciones * historialPreciosFiltrado.at(-1).CLOSE).toFixed(2)
            }
        };
    }


    function calcularResumenFinanciero(señales, historialPreciosFiltrado, capitalInicial) {
        let cash = capitalInicial;
        let unidadesEnCartera = 0;
        let totalComprado = 0;
        let totalVendido = 0;
        let costoTotalComprado = 0; // para calcular ganancia real

        for (const señal of señales) {
            console.log(señal);
            if (!señal.DATE) {
                console.log("no fecha");
                continue; // fecha no definida, saltar
            }
            const fecha = new Date(señal.DATE);
            if (isNaN(fecha.getTime())) continue; // fecha inválida, saltar

            const fechaISO = fecha.toISOString().slice(0, 10);

            const precioDia = historialPreciosFiltrado.find(
                p => new Date(p.DATE).toISOString().slice(0, 10) === fechaISO
            );

            if (!precioDia) continue;

            const precio = precioDia.CLOSE;

            if (señal.TYPE === "compra" && señal.SHARES > 0) {
                const costoOperacion = precio * señal.SHARES;
                if (costoOperacion <= cash) {
                    cash -= costoOperacion;
                    unidadesEnCartera += señal.SHARES;
                    totalComprado += señal.SHARES;
                    costoTotalComprado += costoOperacion;
                }
                // si no hay cash suficiente, ignora la compra (o podrías comprar parcial)
            } else if (señal.TYPE === "venta" && señal.SHARES > 0) {
                const unidadesAVender = Math.min(señal.SHARES, unidadesEnCartera);
                const ingresoOperacion = unidadesAVender * precio;
                cash += ingresoOperacion;
                unidadesEnCartera -= unidadesAVender;
                totalVendido += unidadesAVender;
                // Para ganancia real simple, podríamos restar costo proporcional a lo vendido
                costoTotalComprado -= (costoTotalComprado / (unidadesEnCartera + unidadesAVender)) * unidadesAVender;
            }
            // ignoramos "mantener" u otros tipos
        }

        // Precio cierre del último día para valor final
        const ultimoPrecio = historialPreciosFiltrado.length
            ? historialPreciosFiltrado[historialPreciosFiltrado.length - 1].CLOSE
            : 0;

        const valorFinal = unidadesEnCartera * ultimoPrecio;
        const balanceFinal = cash + valorFinal;
        const gananciaReal = balanceFinal - capitalInicial;

        return {
            SUMMARY: {
                TOTAL_BOUGHT_UNITS: +totalComprado.toFixed(4),
                TOTAL_SOLD_UNITS: +totalVendido.toFixed(4),
                REMAINING_UNITS: +unidadesEnCartera.toFixed(4),
                FINAL_CASH: +cash.toFixed(2),
                FINAL_VALUE: +valorFinal.toFixed(2),
                FINAL_BALANCE: +balanceFinal.toFixed(2),
                REAL_PROFIT: +gananciaReal.toFixed(2),
            },
        };
    }


    //REVISAR SI ESTA BIEN ESTAS COSAS
    const resultadoSimulacion = simularEstrategiaTrading(indicadoresFiltrados, priceHistoryFiltrado, AMOUNT);
    //  console.log(resultadoSimulacion)
    const resumen = calcularResumenFinanciero(resultadoSimulacion.SEÑALES, priceHistoryFiltrado, AMOUNT);
    console.log(resumen);



}

module.exports = { SimulateMomentum };