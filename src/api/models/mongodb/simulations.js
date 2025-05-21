const mongoose = require("mongoose");

const SignalSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  type: { type: String},
  price: { type: Number, required: true },
  reasoning: { type: String },
}, { _id: false });

// Subdocumento de DETAIL_ROW_REG (registro de auditoría)
const detailRowRegSchema = new mongoose.Schema({
    CURRENT: Boolean,
    REGDATE: Date,
    REGTIME: Date,
    REGUSER: String
}, { _id: false });

// Subdocumento de DETAIL_ROW
const detailRowSchema = new mongoose.Schema({
    ACTIVED: Boolean,
    DELETED: Boolean,
    DETAIL_ROW_REG: [detailRowRegSchema]
}, { _id: false });

const SimulationSchema = new mongoose.Schema({
  idSimulation: {type: String, required: true },
  userId: { type: String, required: true },
  idStrategy: { type: String, required: true },
  simulationName: { type: String, required: true },
  symbol: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  amount: { type: Number, required: true },
  specs: { type: String },
  signals: [SignalSchema],
  result: { type: Number },
  percentageReturn: { type: Number },
  DETAIL_ROW: detailRowSchema
});

module.exports = mongoose.model("ZTSIMULATIONS", SimulationSchema, "ZTSIMULATIONS");
