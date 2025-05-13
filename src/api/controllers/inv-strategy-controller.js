const cds = require('@sap/cds');

const { StrategyCrud } = require('../services/inv-strategy-service');
class invStrategy extends cds.ApplicationService {
    async init(){
   

      //CRUD DE LABELS
       this.on('strategy',async (req)=>{

            return StrategyCrud(req);
        });

     
    };
};
module.exports = invStrategy;