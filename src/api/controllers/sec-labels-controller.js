const cds = require('@sap/cds');
const {GetAllLabels} = require('../services/sec-labels-service');
class SecurityClass extends cds.ApplicationService {
    async init(){
        this.on('getall',async (req)=>{
            return GetAllLabels(req);
        });
        //more functions
        return await super.init();
    };
};
module.exports = SecurityClass;