const cds = require('@sap/cds');
const {
    getIndicadors
} = require('../services/sec-indicadors-service');

class IndicatorsClass extends cds.ApplicationService {
  async init() {
    this.on('getall', async (req) => {
      return getIndicadors(req);
    });

 

    return await super.init();
  }
}

module.exports = IndicatorsClass;
