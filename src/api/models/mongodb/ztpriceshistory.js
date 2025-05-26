const mongoose = require('mongoose');

const DataPointSchema = new mongoose.Schema({
    DATE    :{type : Date, default: Date.now},
    OPEN    :{type:Number},
    HIGH    :{type:Number},
    LOW     :{type:Number},
    CLOSE   :{type:Number},
    VOLUME  :{type:Number},
});

const PriceHistory = new mongoose.Schema({
  symbol: { type: String, required: true },
  name: { type: String, required: true }, //
  assetType: { type: String, required: true }, 
  interval: { type: String, required: true }, 
  timezone: { type: String, required: true },
  data: { type: [DataPointSchema], required: true }
})

module.exports = mongoose.model(
    'ZTPRICESHISTORY',
    PriceHistory,
    'ZTPRICESHISTORY'
);