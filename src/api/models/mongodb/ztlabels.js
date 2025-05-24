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

const ztlabelsSchema = new mongoose.Schema({
    COMPANYID     :{ type: String, required: true }, 
    CEDIID    :{type : String, required: true},
    LABELID     :{ type: String, required: true }, 
    LABEL    :{type : String},
    INDEX     :{ type: String}, 
    COLLECTION    :{type : String},
    SECTION    :{type : String},
    SEQUENCE    :{type : Number},
    IMAGE    :{type : String},
    DESCRIPTION    :{type : String},
    DETAIL_ROW : DetailRowSchema
});

// Middleware automático antes de guardar
ztlabelsSchema.pre('save', function (next) {
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

module.exports = mongoose.model(
    'ZTELABELS',
     ztlabelsSchema,
    'ZTELABELS'
);