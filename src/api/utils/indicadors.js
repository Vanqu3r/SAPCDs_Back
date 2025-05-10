function calculateEMA(prices, period) {

    const k = 2 / (period + 1);
    let emaArray = [];
    let ema = prices.slice(0, period).reduce((a, b) => a + b.close, 0) / period;
  
    for (let i = 0; i < prices.length; i++) {
      if (i < period) {
        emaArray.push(null);
      } else {
        ema = prices[i].close * k + ema * (1 - k);
        emaArray.push(parseFloat(ema.toFixed(2)));
      }
    }
  
    return emaArray;
  }
  
  function calculateRSI(data, period = 14) {
    let rsiArray = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period) {
        rsiArray.push(null);
      } else {
        let gains = 0;
        let losses = 0;
        for (let j = i - period + 1; j <= i; j++) {
          const diff = data[j].close - data[j - 1].close;
          if (diff >= 0) gains += diff;
          else losses -= diff;
        }
        const rs = gains / (losses || 1);
        rsiArray.push(parseFloat((100 - 100 / (1 + rs)).toFixed(2)));
      }
    }
    return rsiArray;
  }
  
  function calculateIndicators(prices, indicators) {
    
    const short = indicators.includes("EMA21") ? calculateEMA(prices, 21) : [];
    const long = indicators.includes("EMA50") ? calculateEMA(prices, 50) : [];
    const rsi = indicators.includes("RSI") ? calculateRSI(prices, 14) : [];
  
    return prices.map((item, i) => ({
      date: item.date,
      ...Object.fromEntries(
        Object.entries(item).filter(([key]) => key !== "date")
      ),
      ...(short.length ? { SHORT: short[i] } : {}),
      ...(long.length ? { LONG: long[i] } : {}),
      ...(rsi.length ? { RSI: rsi[i] } : {}),

    }));
  }
  
  module.exports = { calculateIndicators };
  