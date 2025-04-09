const mongoose = require('mongoose');

const ztpriceshistorySchema = new mongoose.Schema({
    ID      :{ type: Number, required: true }, 
    DATE    :{type : Date, default: Date.now},
    OPEN    :{type:Number},
    HIGH    :{type:Number},
    LOW     :{type:Number},
    CLOSE   :{type:Number},
    VOLUME  :{type:Number},
});

module.exports = mongoose.model(
    'ZTPRICESHISTORY',
    ztpriceshistorySchema,
    'ZTPRICESHISTORY'
);