const mongoose = require('mongoose');

const DetailRowRegSchema = new mongoose.Schema({
  CURRENT: Boolean,
  REGDATE: Date,
  REGTIME: Date,
  REGUSER: String
}, { _id: false });

const DetailRowSchema = new mongoose.Schema({
  ACTIVED: Boolean,
  DELETED: Boolean,
  DETAIL_ROW_REG: [DetailRowRegSchema]
}, { _id: false });

const ValueSchema = new mongoose.Schema({
  COMPANYID: Number,
  CEDIID: Number,
  LABELID: String,
  VALUEPAID: String,
  VALUEID: String,
  VALUE: String,
  ALIAS: String,
  SEQUENCE: Number,
  IMAGE: String,
  VALUESAPID: String,
  DESCRIPTION: String,
  DETAIL_ROW: DetailRowSchema
}, {
  collection: 'ZTEVALUES', 
  versionKey: false         
});

module.exports = mongoose.model('ZTEVALUES', ValueSchema);
