const mongoose = require('mongoose');

const detailRowRegSchema = new mongoose.Schema({
  CURRENT: { type: Boolean },
  REGDATE: { type: Date, default: Date.now },
  REGTIME: { type: Date, default: Date.now },
  REGUSER: { type: String }
}, { _id: false });

const detailRowSchema = new mongoose.Schema({
  ACTIVED: { type: Boolean, default: true },
  DELETED: { type: Boolean, default: false },
  DETAIL_ROW_REG: { type: [detailRowRegSchema], default: [] }
}, { _id: false });

 const indicator = new mongoose.Schema({
  NAME    :{ type: String, required: true },
  DESCRIPTION     :{ type: String, required: true }
},{ _id: false });

const strategy = new mongoose.Schema({
  ID     :{ type: String, required: true }, 
  NAME    :{ type: String, required: true },
  DESCRIPTION     :{ type: String, required: true },
  INDICATORS :{type: [indicator], default: []},
  DETAILSROW :{type: [detailRowSchema], default:[]}
});

module.exports = mongoose.model('STRATEGY', strategy,'STRATEGY');