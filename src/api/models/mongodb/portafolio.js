const mongoose = require('mongoose');

const PortafolioRecordSchema = new mongoose.Schema({
  SIMULATIONID: { type: String, required: true },
  INITIAL_CASH: { type: Number, required: true, default: 100 },
  CURRENT_CASH: { type: Number, required: true },
  CURRENT_SHARES: { type: Number, required: true },
  TOTAL_BOUGHT_UNITS: { type: Number, required: true },
  LAST_PRICE: { type: Number, required: true },
  TOTAL_VALUE: { type: Number, required: true },
  PERCENTAGE_RETURN: { type: Number, required: true },
 // SIMULATION_DATE:  {type: Date, required:true, default: new Date().toISOString().split(0,10) },

});

const DETAIL_ROW_REG_SCHEMA = new mongoose.Schema({
  CURRENT: Boolean,
 // REGDATE: Date,
  REGTIME: String,
  REGUSER: String
}, { _id: false });

const DETAIL_ROW_SCHEMA = new mongoose.Schema({
  ACTIVED: Boolean,
  DELETED: Boolean,
  DETAIL_ROW_REG: { type: [DETAIL_ROW_REG_SCHEMA], default: [] }
}, { _id: false });

const PortafolioStatusSchema = new mongoose.Schema({
  USERID: { type: String, required: true, unique: true },
  HISTORY: [PortafolioRecordSchema],
  DETAIL_ROW: DETAIL_ROW_SCHEMA
});

module.exports = mongoose.model('PORTAFOLIO', PortafolioStatusSchema,'PORTAFOLIO');
