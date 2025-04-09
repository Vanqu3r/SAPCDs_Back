const cds = require('@sap/cds');
const {GetAllPricesHistory,AddOnePricesHistory,DeleteOnePricesHistory} = require('../services/inv-priceshistory-service');
class InversionsClass extends cds.ApplicationService {
    async init(){
        this.on('getall',async (req)=>{
            return GetAllPricesHistory(req);
        });
        this.on('addone',async (req)=>{
            return AddOnePricesHistory(req);
        });
        this.on('deleteone',async (req)=>{
            return DeleteOnePricesHistory(req);
        });
        //more functions
        return await super.init();
    };
};
module.exports = InversionsClass;