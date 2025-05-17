function calculateEMA(data, period) {
  const k = 2 / (period + 1);
  const emaArray = [];
  // Función para obtener el valor: si es objeto y tiene "close", lo toma; de lo contrario, asume que es un número.
  const getValue = (d) =>
    typeof d === "object" && d !== null && d.close !== undefined ? d.close : d;

  // Si no hay suficientes datos, llenar con null.
  if (data.length < period) {
    for (let i = 0; i < data.length; i++) {
      emaArray.push(null);
    }
    return emaArray;
  }

  // Calcular el promedio simple de los primeros "period" valores (los datos más antiguos)
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += getValue(data[i]);
  }
  let ema = sum / period;

  // Los primeros period-1 índices no tienen EMA calculada (puedes dejarlos en null o asignar el primer promedio a la posición period-1)
  for (let i = 0; i < period - 1; i++) {
    emaArray.push(null);
  }
  emaArray.push(parseFloat(ema.toFixed(2)));

  // A partir de ahí, calcular EMA para los siguientes valores
  for (let i = period; i < data.length; i++) {
    const price = getValue(data[i]);
    ema = price * k + ema * (1 - k);
    emaArray.push(parseFloat(ema.toFixed(2)));
  }

  return emaArray;
}

function calculateRSI(data, period = 14) {
  const rsiArray = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      rsiArray.push(null);
    } else {
      let gains = 0;
      let losses = 0;
      // Se calcula la diferencia entre el cierre actual y el anterior en el período
      for (let j = i - period + 1; j <= i; j++) {
        const change = data[j].close - data[j - 1].close;
        if (change > 0) {
          gains += change;
        } else {
          losses -= change; // change es negativo
        }
      }
      const avgGain = gains / period;
      const avgLoss = losses / period;
      const rs = avgLoss === 0 ? 0 : avgGain / avgLoss;
      const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);
      rsiArray.push(parseFloat(rsi.toFixed(5)));
    }
  }
  return rsiArray;
}
  
//MACD, ADX 
function calculateMACD(prices){
  const ema12 = calculateEMA(prices,12);
  const ema26 = calculateEMA(prices,26);

  const macd = ema12.map((value, index) => {
    if (value === null || ema26[index] === null) {
      return null;
    }
    return value - ema26[index];
  });
  
  const validMacd = macd.filter((val) => val !== null);
  const signalFull = calculateEMA(validMacd, 9);
  const signal = [];
  let nullCount = macd.findIndex((val) => val !== null);
  if (nullCount === -1) nullCount = 0; // En caso de que no se encuentre, aunque no debería pasar.
  for (let i = 0; i < nullCount; i++) {
    signal.push(null);
  }
  signal.push(...signalFull);

  // Calcular el histograma: diferencia entre MACD y Línea Señal
  const histo = macd.map((value, index) => {
    if (value === null || signal[index] === null) {
      return null;
    }
    return value - signal[index];
  });

  const macdArray = macd.map((value,i)=>({
    macd: value,
    signal: signal[i],
    histogram: histo[i]
  }));

  return macdArray;
}

function calculateADX(prices,period=14) {
  const dxArray = [];
  // Empezar desde el índice 1 para poder usar el dato anterior (ayer)
  for (let i = 1; i < prices.length; i++) {
    const highToday = parseFloat(prices[i].high);
    const lowToday = parseFloat(prices[i].low);
    const closeYesterday = parseFloat(prices[i - 1].close);
    const highYesterday = parseFloat(prices[i - 1].high);
    const lowYesterday = parseFloat(prices[i - 1].low);

    // Calcular +DM y -DM
    const plusDM = highToday > highYesterday ? highToday - highYesterday : 0;
    const minusDM = lowYesterday > lowToday ? lowYesterday - lowToday : 0;

    // Calcular True Range (TR)
    const tr = Math.max(
      highToday - lowToday,
      Math.abs(highToday - closeYesterday),
      Math.abs(lowToday - closeYesterday)
    );

    // Calcular +DI y -DI
    const plusDI = (plusDM / tr) * 100;
    const minusDI = (minusDM / tr) * 100;

    // Calcular DX
    const dx = (Math.abs(plusDI - minusDI) / (plusDI + minusDI)) * 100;
    dxArray.push(dx);
  }

  // Suavizar los valores de DX con una EMA para obtener el ADX
  const adx = calculateEMA(dxArray, period);
  return adx;
}

function calculateIndicators(prices, indicators) {
  console.log("DATOS:",prices.length);
  const short = indicators.includes("EMA21") ? calculateEMA(prices, 21) : [];
  const long = indicators.includes("EMA50") ? calculateEMA(prices, 50) : [];
  const rsi = indicators.includes("RSI") ? calculateRSI(prices, 14) : [];
  const macd = indicators.includes("MACD") ? calculateMACD(prices) : [];
  const adx = indicators.includes("ADX") ? calculateADX(prices,14) : [];

  return prices.map((item, i) => ({
    date: item.date,
    ...Object.fromEntries(
      Object.entries(item).filter(([key]) => key !== "date")
    ),
    ...(short.length ? { SHORT: short[i] } : {}),
    ...(long.length ? { LONG: long[i] } : {}),
    ...(rsi.length ? { RSI: rsi[i] } : {}),
    ...(macd.length ? {MACD: macd[i]}:{}),
    ...(adx.length ? {ADX: adx[i]} : {})
  }));
}
  
  module.exports = { calculateIndicators };
  
//Codigo viejo:

  // const k = 2 / (period + 1);
  // let emaArray = [];
  // let ema = prices.slice(0, period).reduce((a, b) => a + b.close, 0) / period;

  // for (let i = 0; i < prices.length; i++) {
  //   ema = prices[i].close * k + ema * (1 - k);
  //   emaArray.push(parseFloat(ema.toFixed(2)));
    
  // }

  // return emaArray;