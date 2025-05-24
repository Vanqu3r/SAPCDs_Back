const SimulationModel = require('../models/mongodb/simulations');
const axios = require('axios');
require('dotenv').config();//para usar el .env despues
const API_KEY = '7NONLRJ6ARKI0BA4';

async function SimulateMomentum(req) {
    const { SYMBOL, STARTDATE, ENDDATE, AMOUNT, USERID, SPECS } = req || {};
    console.log(req);
    const numR = Math.floor(Math.random() * 1000).toString();
    //GENERAR ID pa' la estrategia
    const idStrategy = (symbol, usuario) => {
        const date = new Date();
        const timestamp = date.toISOString().slice(0, 10);
        const user = usuario[0];
        return `${symbol}-${timestamp}-${user}-${numR}`;
    };
    //Datos Estaticos para la respuesta
    const SIMULATIONID = idStrategy(SYMBOL, USERID);
    const SIMULATIONNAME = "Estrategia de Momentum-" + numR;
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
    // ||||||| <---Usos de la API
    const APIURL = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${SYMBOL}&outputsize=full&apikey=${API_KEY}`;
    const response = await axios.get(APIURL);
    const data = response.data["Time Series (Daily)"]; // objeto por fechas
    const parsedData = Object.entries(data).map(([date, values]) => ({
        DATE: new Date(date).toISOString().slice(0, 10),
        OPEN: parseFloat(values["1. open"]),
        HIGH: parseFloat(values["2. high"]),
        LOW: parseFloat(values["3. low"]),
        CLOSE: parseFloat(values["4. close"]),
        VOLUME: parseFloat(values["5. volume"])
    }));



    //filtrar por fecha
    function filtrarPorFecha(data, startDate, endDate) {
        return data.filter(item => {
            let itemdate = new Date(item.DATE).toISOString().slice(0, 10);
            return itemdate >= startDate && itemdate <= endDate;
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
            DATE: new Date(item.DATE).toISOString().slice(0, 10),
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

    //constuir el chart_data ✅
    function ChartData(priceHistoryFiltrado, indicadoresFiltrados) {
        return priceHistoryFiltrado.map((precio) => {
            const fecha = new Date(precio.DATE).toISOString().slice(0, 10);
            const ind = indicadoresFiltrados.find((i) => i.DATE === fecha) || {};

            return {
                DATE: fecha,
                OPEN: precio.OPEN,
                HIGH: precio.HIGH,
                LOW: precio.LOW,
                CLOSE: precio.CLOSE,
                VOLUME: precio.VOLUME,
                INDICATORS: [
                    { INDICATOR: "short_ma", VALUE: ind.SHORT ?? null },
                    { INDICATOR: "long_ma", VALUE: ind.LONG ?? null },
                    { INDICATOR: "rsi", VALUE: ind.RSI ?? null },
                    { INDICATOR: "adx", VALUE: ind.ADX ?? null }
                ]
            };
        });
    }



    const chartData = ChartData(priceHistoryFiltrado, indicadoresFiltrados);
    //console.log(chartData);

    //✅
    //Comprobar que dias se cumple con las condiciones de los indicadores y generar las señales
    function simularEstrategiaTrading(indicadoresFiltrados, historialpricesFiltrado) {
        const señales = [];

        for (let i = 1; i < indicadoresFiltrados.length; i++) {
            const anterior = indicadoresFiltrados[i - 1];
            const actual = indicadoresFiltrados[i];

            const priceDia = historialpricesFiltrado.find(
                price =>
                    new Date(price.DATE).toISOString().slice(0, 10) ===
                    new Date(actual.DATE).toISOString().slice(0, 10)
            );
            if (!priceDia) continue;

            const precio = priceDia.CLOSE;
            const volumenAnterior = historialpricesFiltrado[i - 1]?.VOLUME || 0;
            const volumenActual = priceDia.VOLUME;

            const adxSubiendo = actual.ADX > 25;


            const rsiCondicion = actual.RSI > 55 && actual.RSI < 75;
            const volumenSubiendo = volumenActual > volumenAnterior;
            const cruceAlcista = actual.SHORT > actual.LONG


            // COMPRA
            if (
                (rsiCondicion &&
                    adxSubiendo &&
                    volumenSubiendo) ||
                (cruceAlcista &&
                    rsiCondicion &&
                    adxSubiendo &&
                    volumenSubiendo)
            ) {
                señales.push({
                    DATE: actual.DATE,
                    TYPE: 'buy',
                    PRICE: precio,
                    REASONING:
                        'Golden Cross con RSI, ADX y volumen confirmando momentum',
                });
            }

            // VENTA - basta con que se cumplan 3 de estas
            const cruceBajista =
                anterior.SHORT > anterior.LONG && actual.SHORT < actual.LONG;
            const precioDebajoMAs =
                precio < actual.SHORT && precio < actual.LONG;
            const rsiBaja = actual.RSI < 55;
            const adxDebil = actual.ADX < 20;
            const volumenNegativo =
                (precio > anterior.CLOSE && volumenActual < volumenAnterior) ||
                (precio < anterior.CLOSE && volumenActual > volumenAnterior);

            const señalesVenta = [
                cruceBajista,
                precioDebajoMAs,
                rsiBaja,
                adxDebil,
                volumenNegativo
            ].filter(Boolean).length;

            if (señalesVenta >= 3) {
                señales.push({
                    DATE: actual.DATE,
                    TYPE: 'sell',
                    PRICE: precio,
                    REASONING:
                        'Múltiples señales de salida detectadas (cruce bajista, RSI bajando, ADX débil, volumen dudoso)',
                });
            }
        }

        return { SEÑALES: señales };
    }

    //✅ Aplicar la estrategia los dias de las señales 
    //Vender primero lo primero que se compro, no vender hasta que haya comprado
    //✅ Generar el resumen financiero
    function calcularResumenFinanciero(señales, PHF, capitalInicial) {
        let lotes = []; // [{ cantidad, price, fecha }]
        let efectivo = capitalInicial;
        const señalesEjecutadas = [];

        let totalComprado = 0;
        let totalVendido = 0;
        let costoTotalComprado = 0;
        let gananciaReal = 0;

        for (const señal of señales) {
            const { DATE, TYPE, PRICE, REASONING } = señal;

            if (TYPE === "buy") {
                const acciones = +(efectivo / PRICE).toFixed(6);
                if (acciones > 0) {
                    efectivo -= acciones * PRICE;
                    lotes.push({ cantidad: acciones, price: PRICE, fecha: new Date(DATE) });

                    totalComprado += acciones;
                    costoTotalComprado += acciones * PRICE;

                    señalesEjecutadas.push({
                        DATE,
                        TYPE,
                        PRICE,
                        REASONING,
                        SHARES: acciones
                    });
                }

            } else if (TYPE === "sell") {
                let totalAcciones = lotes.reduce((sum, lote) => sum + lote.cantidad, 0);
                let accionesVendidas = 0;
                if (totalAcciones > 0) {
                    let accionesAVender = totalAcciones;

                    let ingreso = 0;
                    let costoVenta = 0;

                    lotes.sort((a, b) => a.fecha - b.fecha); // FIFO

                    for (let i = 0; i < lotes.length && accionesAVender > 0; i++) {
                        const lote = lotes[i];
                        const cantidad = Math.min(lote.cantidad, accionesAVender);
                        ingreso += cantidad * PRICE;
                        costoVenta += cantidad * lote.price;
                        lote.cantidad -= cantidad;
                        accionesAVender -= cantidad;
                        accionesVendidas += cantidad;
                    }

                    lotes = lotes.filter(l => l.cantidad > 0); // Eliminar lotes vacíos
                    efectivo += ingreso;

                    totalVendido += accionesVendidas;
                    gananciaReal += ingreso - costoVenta;
                }
                señalesEjecutadas.push({
                    DATE,
                    TYPE,
                    PRICE,
                    REASONING,
                    SHARES: accionesVendidas
                });
            }
        }

        const accionesRestantes = lotes.reduce((sum, lote) => sum + lote.cantidad, 0);
        // Obtener price de cierre del último día
        const priceFinal = PHF.length > 0
            ? PHF[PHF.length - 1].CLOSE
            : 0;

        const resumen = {
            TOTAL_BOUGHT_UNITS: +totalComprado.toFixed(4),
            TOTAL_SOLD_UNITS: +totalVendido.toFixed(4),
            REMAINING_UNITS: +(totalComprado - totalVendido).toFixed(4),
            FINAL_CASH: +efectivo.toFixed(2),
            FINAL_VALUE: +(priceFinal !== null ? accionesRestantes * priceFinal : 0).toFixed(2),
            FINAL_BALANCE: +(efectivo + (priceFinal !== null ? accionesRestantes * priceFinal : 0)).toFixed(2),
            REAL_PROFIT: +gananciaReal.toFixed(2)
        };

        return {
            SUMMARY: resumen,
            SIGNALS: señalesEjecutadas
        };
    };


    //REVISAR SI ESTA BIEN ESTAS COSAS
    const resultadoSimulacion = simularEstrategiaTrading(indicadoresFiltrados, priceHistoryFiltrado);
    const resumen = calcularResumenFinanciero(resultadoSimulacion.SEÑALES, priceHistoryFiltrado, AMOUNT);

    //detail row 


    //resultado de la simulacion
    const simulacion = {
        SIMULATIONID,
        USERID,
        STRATEGYID,
        SIMULATIONNAME,
        SYMBOL,
        INDICATORS: SPECS,
        AMOUNT,
        STARTDATE,
        ENDDATE,
        SIGNALS: resumen.SIGNALS,
        SUMMARY: resumen.SUMMARY,
        CHART_DATA: chartData,
        DETAIL_ROW: {
            ACTIVED: true,
            DELETED: false,
            DETAIL_ROW_REG: [
                {
                    CURRENT: true,
                    REGDATE: new Date().toISOString().slice(0, 10), // Formato "YYYY-MM-DD"
                    REGTIME: new Date().toTimeString().slice(0, 8),  // Formato "HH:MM:SS"
                    REGUSER: USERID
                }
            ]
        }
    };

    try {
        const nuevaSimulacion = new SimulationModel(simulacion);
        await nuevaSimulacion.save();
        console.log("Simulacion guardada en la base de datos.");
        //console.log(nuevaSimulacion);

    } catch (error) {
        return {
            status: 500,
            message: error.message
        }
    }

    return {
        simulacion
    }

}


async function simulateSupertrend(req) {
    console.log(req);


    try {
        const { SYMBOL, STARTDATE, ENDDATE, AMOUNT, USERID, SPECS } = req || {};


        if (!SYMBOL || !STARTDATE || !ENDDATE || !AMOUNT || !USERID) {
            throw new Error(
                "FALTAN PARÁMETROS REQUERIDOS EN EL CUERPO DE LA SOLICITUD: 'SYMBOL', 'STARTDATE', 'ENDDATE', 'AMOUNT', 'USERID'."
            );
        }


        if (new Date(ENDDATE) < new Date(STARTDATE)) {
            throw new Error(
                "La fecha de fin  no puede ser anterior a la fecha de inicio."
            );
        }


        // Verificar si AMOUNT es numérico
        if (isNaN(AMOUNT) || typeof AMOUNT !== 'number' || AMOUNT <= 0) {
            throw new Error("El monto a invertir debe ser una cantidad válida.");
        }



        //METODO PARA ASIGNAR UN ID A LA SIMULACION BASADO EN LA FECHA
        const generateSimulationId = (SYMBOL) => {
            const date = new Date();
            const timestamp = date.toISOString().replace(/[^0-9]/g, "");
            const random = Math.floor(Math.random() * 10000);
            return `${SYMBOL}_${timestamp}_${random}`;
        };


        const SIMULATIONID = generateSimulationId(SYMBOL);
        const SIMULATIONNAME = "Estrategia Supertrend + MA";
        const STRATEGYID = "idST";


        //Se buscan los identificadores en SPECS
        const MALENGTH =
            parseInt(
                SPECS?.find((i) => i.INDICATOR?.toLowerCase() === "ma_length")?.VALUE
            ) || 20;
        const ATR_PERIOD =
            parseInt(
                SPECS?.find((i) => i.INDICATOR?.toLowerCase() === "atr")?.VALUE
            ) || 10;
        const MULT =
            parseFloat(
                SPECS?.find((i) => i.INDICATOR?.toLowerCase() === "mult")?.VALUE
            ) || 2.0;
        const RR =
            parseFloat(
                SPECS?.find((i) => i.INDICATOR?.toLowerCase() === "rr")?.VALUE
            ) || 1.5;


        if (isNaN(MALENGTH) || isNaN(ATR_PERIOD) || isNaN(MULT) || isNaN(RR)) {
            throw new Error(
                "Los parámetros para la simulación deben ser valores numéricos."
            );
        }
        if (MALENGTH <= 0 || ATR_PERIOD <= 0 || MULT <= 0 || RR <= 0) {
            throw new Error(
                "Los parámetros para la simulación deben ser mayores a 0."
            );
        }


        //Se realiza la consulta de los historicos a AlphaVantage
        const apiKey = process.env.ALPHA_VANTAGE_KEY || "demo";
        const apiUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${SYMBOL}&outputsize=full&apikey=${API_KEY}`;
        const resp = await axios.get(apiUrl);


        const rawTs = resp.data["Time Series (Daily)"];
        if (!rawTs) throw new Error("Respuesta inválida de AlphaVantage");


        //Ordena las fechas de forma cronológica
        const allDatesSorted = Object.keys(rawTs).sort(
            (a, b) => new Date(a) - new Date(b)
        );


        //Ajusta el indice de inicio
        const extendedStartIndex =
            allDatesSorted.findIndex((d) => d >= STARTDATE) -
            Math.max(MALENGTH, ATR_PERIOD);
        const adjustedStartIndex = extendedStartIndex >= 0 ? extendedStartIndex : 0; //Si no hay suficientes datos históricos, se inicia desde el primer dato disponible.


        //Filtra y mapea los precios
        const prices = allDatesSorted
            .slice(adjustedStartIndex) //Toma las fechas desde adjustedStartIndex
            .filter((date) => date <= ENDDATE) //Filtra fechas posteriores a ENDDATE
            .map((date) => ({
                //Convierte cada fecha en un objeto con los datos de precio
                DATE: date,
                OPEN: +rawTs[date]["1. open"],
                HIGH: +rawTs[date]["2. high"],
                LOW: +rawTs[date]["3. low"],
                CLOSE: +rawTs[date]["4. close"],
                VOLUME: +rawTs[date]["5. volume"],
            }));


        //Formula para calcular la Media Móvil Simple (SMA)
        const sma = (arr, len) =>
            arr.map((_, i) =>
                i >= len - 1
                    ? arr.slice(i - len + 1, i + 1).reduce((a, b) => a + b, 0) / len
                    : null
            );


        //Formula para calcular el Average True Range (ATR)


        const atr = (arr, period) => {
            const result = Array(arr.length).fill(null);
            const trValues = []; // Array para almacenar los TR


            for (let i = 1; i < arr.length; i++) {
                const high = arr[i].HIGH;
                const low = arr[i].LOW;
                const prevClose = arr[i - 1].CLOSE;


                // Calcula el TR y lo guarda en el array
                const tr = Math.max(
                    high - low,
                    Math.abs(high - prevClose),
                    Math.abs(low - prevClose)
                );
                trValues.push(tr);


                // Calcula el ATR cuando hay suficientes datos
                if (i >= period) {
                    const startIdx = i - period;
                    const atr =
                        trValues.slice(startIdx, i).reduce((a, b) => a + b, 0) / period;
                    result[i] = atr;
                } else {
                    result[i] = null;
                }
            }


            return result;
        };
        const closes = prices.map((p) => p.CLOSE); //Se almacena el array de precios de cierre
        const ma = sma(closes, MALENGTH); //Se almacena el array de MA calculado
        const atrVals = atr(prices, ATR_PERIOD); //Se almacena el array de ATR calculado


        let position = null;
        const signals = [];
        let cash = parseFloat(AMOUNT);
        let shares = 0;
        let realProfit = 0;
        const chartData = [];


        for (let i = MALENGTH; i < prices.length; i++) {
            const bar = prices[i];
            const close = bar.CLOSE;
            const trendUp = close > ma[i];
            const trendDown = close < ma[i];
            const stopDistance = atrVals[i] * MULT;
            const profitDistance = stopDistance * RR;


            let currentSignal = null;
            let reasoning = null;
            let profitLoss = 0;
            let sharesTransacted = 0;


            // Lógica de COMPRA (El precio cierra por encima de la MA, y la tendencia es alcista, y el precio del dia anterior estaba por debajo de la MA)
            if (!position && cash > 0 && trendUp && closes[i - 1] < ma[i - 1]) {
                const invest = cash * 1; // Invierto todo el capital disponible, previamente solo se usaba el 50%
                shares = invest / close;
                cash -= invest;
                position = {
                    entryPrice: close,
                    stop: close - stopDistance,
                    limit: close + profitDistance,
                };
                currentSignal = "buy";
                reasoning = "Tendencia alcista identificada.";
                sharesTransacted = shares; // Registrar unidades compradas
            }
            // Lógica de VENTA  (El precio alcanza el nivel objetivo o, el precio cae hasta el nivel del stop-loss o, el precio cierra por debajo de la MA)
            else if (position) {
                if (close >= position.limit || close <= position.stop || trendDown) {
                    const soldShares = shares; // Guardar unidades antes de resetear
                    cash += soldShares * close;
                    profitLoss = (close - position.entryPrice) * soldShares;
                    realProfit += profitLoss;
                    currentSignal = "sell";
                    if (close >= position.limit) {
                        reasoning = "Precio objetivo alcanzado.";
                    }
                    if (close <= position.stop) {
                        reasoning = "Stop-loss alcanzado.";
                    }
                    if (trendDown) {
                        reasoning = "Precio por debajo de la MA";
                    }
                    sharesTransacted = soldShares; // Registrar unidades vendidas
                    shares = 0; // Resetear después de registrar
                    position = null;
                }
            }


            // Registrar la señal (compra o venta)
            if (currentSignal) {
                signals.push({
                    DATE: bar.DATE,
                    TYPE: currentSignal,
                    PRICE: parseFloat(close.toFixed(2)),
                    REASONING: reasoning,
                    SHARES: parseFloat(sharesTransacted.toFixed(15)), // Usar sharesTransacted
                    PROFIT: parseFloat(profitLoss.toFixed(2)),
                });
            }


            // Datos para el gráfico
            chartData.push({
                ...bar,
                INDICATORS: [
                    { INDICATOR: "ma", VALUE: parseFloat((ma[i] ?? 0).toFixed(2)) },
                    { INDICATOR: "atr", VALUE: parseFloat((atrVals[i] ?? 0).toFixed(2)) },
                ],
            });
        }


        // Calcular métricas finales
        const finalValue = shares * prices.at(-1).CLOSE;
        const finalBalance = cash + finalValue;
        const percentageReturn = ((finalBalance - AMOUNT) / AMOUNT) * 100;


        const summary = {
            TOTAL_BOUGHT_UNITS: parseFloat(
                signals
                    .filter((s) => s.TYPE === "buy")
                    .reduce((a, s) => a + s.SHARES, 0)
                    .toFixed(5)
            ),
            TOTAL_SOLD_UNITS: parseFloat(
                signals
                    .filter((s) => s.TYPE === "sell")
                    .reduce((a, s) => a + s.SHARES, 0)
                    .toFixed(5)
            ),
            REMAINING_UNITS: parseFloat(shares.toFixed(5)),
            FINAL_CASH: parseFloat(cash.toFixed(2)),
            FINAL_VALUE: parseFloat(finalValue.toFixed(2)),
            FINAL_BALANCE: parseFloat(finalBalance.toFixed(2)),
            REAL_PROFIT: parseFloat(realProfit.toFixed(2)),
            PERCENTAGE_RETURN: parseFloat(percentageReturn.toFixed(2)),
        };


        const detailRow = [
            {
                ACTIVED: true,
                DELETED: false,
                DETAIL_ROW_REG: [
                    {
                        CURRENT: true,
                        REGDATE: new Date().toISOString().slice(0, 10),
                        REGTIME: new Date().toLocaleTimeString("es-ES", { hour12: false }),
                        REGUSER: USERID,
                    },
                ],
            },
        ];




        const simulacion = {
            SIMULATIONID,
            USERID,
            STRATEGYID,
            SIMULATIONNAME,
            SYMBOL,
            INDICATORS: { value: SPECS },
            AMOUNT: parseFloat(AMOUNT.toFixed(2)),
            SUMMARY: summary,
            STARTDATE,
            ENDDATE,
            SIGNALS: signals,
            CHART_DATA: chartData,
            DETAIL_ROW: detailRow,
        };
       

        try {
            const nuevaSimulacion = new SimulationModel(simulacion);
            await nuevaSimulacion.save();
            console.log("Simulacion guardada en la base de datos.");
            //console.log(nuevaSimulacion);

        } catch (error) {
            return {
                status: 500,
                message: error.message
            }
        }

    } catch (error) {
        console.error("Error en simulación de Supertrend + MA:", error);
        throw error;
    }
}





module.exports = { SimulateMomentum, simulateSupertrend };