const ztlabels = require('../models/mongodb/ztlabels');

async function GetAllLabels(req) {
    try{
        let labels;
        labels = await ztlabels.find().lean();
        return (labels)
    } catch(error){
        return error;
    } finally{

    }
};

module.exports = {GetAllLabels};