const cds = require('@sap/cds');

//PricesHistoryService
const { GetAllPricesHistory, AddOnePricesHistory, DeleteOnePricesHistory } = require('../services/inv-priceshistory-service');
//indicadoresService
const { getIndicadors } = require('../services/inv-indicadors-service');
//SymbolsService
const { getAllSymbols } = require('../services/inv-symbols-service');

class InversionsRoute extends cds.ApplicationService {
    async init() {
        //PricesHistory
        this.on('getall', async (req) => {
            return GetAllPricesHistory(req);
        });
        this.on('addone', async (req) => {
            return AddOnePricesHistory(req);
        });
        this.on('deleteone', async (req) => {
            return DeleteOnePricesHistory(req);
        });

        //indicadores
        this.on('indicators', async (req) => {
            return getIndicadors(req);
        });

        //Symbols
        this.on('company', async (req) => {
            return getAllSymbols(req);
        });

        //more functions
        return await super.init();
    };
};
module.exports = InversionsRoute;