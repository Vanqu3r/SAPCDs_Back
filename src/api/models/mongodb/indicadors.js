const mongoose = require("mongoose");

// Subdocumento para cada punto de datos
const DataPointSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  close: { type: Number, required: true },
  high: { type: Number, required: true },
  low: { type: Number, required: true },
  volume: { type: Number, required: true },
  SHORT: { type: Number, default: null },
  LONG: { type: Number, default: null },
  RSI: { type: Number, default: null }
}, { _id: false }); // sin _id en los subdocumentos

// Documento principal
const IndicadorSchema = new mongoose.Schema({
  symbol: { type: String, required: true },
  name: { type: String, required: true }, // 
  strategy: { type: String, required: true }, 
  assetType: { type: String, required: true }, 
  interval: { type: String, required: true }, 
  timezone: { type: String, required: true },
  data: { type: [DataPointSchema], required: true }
}, { timestamps: true });

module.exports = mongoose.model("indicadors", IndicadorSchema,"indicadors");
