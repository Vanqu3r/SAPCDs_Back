const mongoose = require('mongoose');

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
    DETAIL_ROW : { 
        type: Object, 
        default: {
            ACTIVED: true,
            DELETED: false,
            DETAIL_ROW_REG: { type: [Object], default: [
                {
                    CURRENT : {type : Boolean},
                    REGDATE : {type : Date, default: Date.now},
                    REGTIEME : {type : Date, default: Date.now},
                    REGUSER : {type : String},
                }
            ] }
        }
    }
});

module.exports = mongoose.model(
    'ZTELABELS',
     ztlabelsSchema,
    'ZTELABELS'
);