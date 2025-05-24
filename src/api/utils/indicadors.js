function calculateEMA(data, period) {
  const k = 2 / (period + 1);
  const emaArray = [];
  const getValue = (d) => (typeof d === "object" && d?.close != null ? d.close : d);

  if (data.length < period) return Array(data.length).fill(null);

  let sum = 0;
  for (let i = 0; i < period; i++) sum += getValue(data[i]);
  let ema = sum / period;

  for (let i = 0; i < period - 1; i++) emaArray.push(null);
  emaArray.push(Number(ema.toFixed(5)));

  for (let i = period; i < data.length; i++) {
    const price = getValue(data[i]);
    ema = price * k + ema * (1 - k);
    emaArray.push(Number(ema.toFixed(5)));
  }

  return emaArray;
}

function calculateRSI(data, period = 14) {
  const rsiArray = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      rsiArray.push(null);
    } else {
      let gains = 0, losses = 0;
      for (let j = i - period + 1; j <= i; j++) {
        const change = data[j].close - data[j - 1].close;
        change > 0 ? (gains += change) : (losses -= change);
      }
      const avgGain = gains / period;
      const avgLoss = losses / period;
      const rs = avgLoss === 0 ? 0 : avgGain / avgLoss;
      const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);
      rsiArray.push(Number(rsi.toFixed(5)));
    }
  }

  return rsiArray;
}

function calculateMACD(prices, { fast = 12, slow = 26, signal = 9 } = {}) {
  const emaFast = calculateEMA(prices, fast);
  const emaSlow = calculateEMA(prices, slow);
  const macd = emaFast.map((val, i) =>
    val != null && emaSlow[i] != null ? Number((val - emaSlow[i]).toFixed(5)) : null
  );

  const validMacd = macd.filter((val) => val != null);
  const signalLine = calculateEMA(validMacd, signal);
  const nullCount = macd.findIndex((v) => v != null);
  const fullSignal = [...Array(nullCount).fill(null), ...signalLine];

  const histogram = macd.map((val, i) =>
    val != null && fullSignal[i] != null ? Number((val - fullSignal[i]).toFixed(5)) : null
  );

  return macd.map((val, i) => ({
    macd: val,
    signal: fullSignal[i],
    histogram: histogram[i],
  }));
}

function calculateADX(prices, period = 14) {
  const dxArray = [];

  for (let i = 1; i < prices.length; i++) {
    const highToday = prices[i].high;
    const lowToday = prices[i].low;
    const closeYesterday = prices[i - 1].close;
    const highYesterday = prices[i - 1].high;
    const lowYesterday = prices[i - 1].low;

    if ([highToday, lowToday, closeYesterday, highYesterday, lowYesterday].some(isNaN)) {
      dxArray.push(null);
      continue;
    }

    const plusDM = Math.max(0, highToday - highYesterday);
    const minusDM = Math.max(0, lowYesterday - lowToday);

    const tr = Math.max(
      highToday - lowToday,
      Math.abs(highToday - closeYesterday),
      Math.abs(lowToday - closeYesterday)
    );

    const plusDI = tr === 0 ? 0 : (plusDM / tr) * 100;
    const minusDI = tr === 0 ? 0 : (minusDM / tr) * 100;
    const dx = plusDI + minusDI === 0 ? 0 : (Math.abs(plusDI - minusDI) / (plusDI + minusDI)) * 100;
    dxArray.push(Number(dx.toFixed(5)));
  }

  const adx = calculateEMA(dxArray, period).map((val) =>
    val == null || isNaN(val) ? null : Number(val.toFixed(5))
  );

  return [null, ...adx]; // compensar el índice perdido
}

function calculateMOM(prices, period = 10) {
  return prices.map((data, i) =>
    i < period
      ? null
      : Number((data.close - prices[i - period].close).toFixed(5))
  );
}

function calculateIndicators(prices, indicators) {
  const results = {
    SHORT: [],
    LONG: [],
    RSI: [],
    MACD: [],
    ADX: [],
    MOM: []
  };

  // Inicializa el Set para rastrear los indicadores procesados
  const indicadoresProcesados = new Set();

  // Lista de indicadores que esperas calcular sí o sí
  const indicadoresEsperados = ["EMA21", "EMA50", "RSI", "MACD", "ADX", "MOM"];

  indicators.forEach((indicator) => {
    const name = (indicator.name || "").toUpperCase();
    const label = (indicator.label || name).toUpperCase();

    indicadoresProcesados.add(label);

    switch (name) {
      case "EMA":
        if (label === "EMA21") results.SHORT = calculateEMA(prices, indicator.period || 21);
        if (label === "EMA50") results.LONG = calculateEMA(prices, indicator.period || 50);
        break;
      case "RSI":
        results.RSI = calculateRSI(prices, indicator.period || 14);
        break;
      case "MACD":
        results.MACD = calculateMACD(prices, {
          fast: indicator.fast || 12,
          slow: indicator.slow || 26,
          signal: indicator.signal || 9,
        });
        break;
      case "ADX":
        results.ADX = calculateADX(prices, indicator.period || 14);
        break;
      case "MOM":
        results.MOM = calculateMOM(prices, indicator.period || 10);
        break;
      default:
        console.warn(`Indicador no reconocido o nombre ausente: "${name}"`);
    }
  });

  // y si no estan :v
  indicadoresEsperados.forEach((ind) => {
    if (!indicadoresProcesados.has(ind)) {
      switch (ind) {
        case "RSI":
          results.RSI = calculateRSI(prices, 14);
          break;
        case "MACD":
          results.MACD = calculateMACD(prices, {
            fast: indicator.fast || 12,
            slow: indicator.slow || 26,
            signal: indicator.signal || 9,
          });
          break;
        case "ADX":
          results.ADX = calculateADX(prices, 14);
          break;
        case "MOM":
          results.MOM = calculateMOM(prices, 10);
          break;
        case "EMA21":
          results.SHORT = calculateEMA(prices, 21);
          break;
        case "EMA50":
          results.LONG = calculateEMA(prices, 50);
          break;
      }
    }
  });

  // El resto de tu código (mapear resultados) aquí...

  return prices.map((item, i) => ({
    date: item.date,
    ...Object.fromEntries(Object.entries(item).filter(([k]) => k !== "date")),
    ...(results.SHORT.length ? { SHORT: results.SHORT[i] } : {}),
    ...(results.LONG.length ? { LONG: results.LONG[i] } : {}),
    ...(results.RSI.length ? { RSI: results.RSI[i] } : {}),
    ...(results.MACD.length ? { MACD: results.MACD[i] } : {}),
    ...(results.ADX.length ? { ADX: results.ADX[i] } : {}),
    ...(results.MOM.length ? { MOM: results.MOM[i] } : {})
  }));
}


module.exports = { calculateIndicators };
