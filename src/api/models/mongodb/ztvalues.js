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

// Middleware automático antes de guardar
ValueSchema.pre('save', function (next) {
        const now = new Date();

        if (!this.DETAIL_ROW) this.DETAIL_ROW = {};

        if (this.DETAIL_ROW.ACTIVED === undefined) {
                this.DETAIL_ROW.ACTIVED = true;
        }
        if (this.DETAIL_ROW.DELETED === undefined) {
                this.DETAIL_ROW.DELETED = false;
        }

        if (!this.DETAIL_ROW.DETAIL_ROW_REG || this.DETAIL_ROW.DETAIL_ROW_REG.length === 0) {
                this.DETAIL_ROW.DETAIL_ROW_REG = [
                        {
                                CURRENT: true,
                                REGDATE: now,
                                REGTIME: now,
                                REGUSER: this._reguser || 'SYSTEM'
                        }
                ];
        }

        next();
});

module.exports = mongoose.model('ZTEVALUES', ValueSchema, 'ZTEVALUES');
