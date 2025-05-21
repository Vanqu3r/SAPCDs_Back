const cds = require('@sap/cds');
//const {GetAllPricesHistory,AddOnePricesHistory,DeleteOnePricesHistory} = require('../services/inv-priceshistory-service');
const {PricesHistoryCrud} = require('../services/inv-priceshistory-service');
const {getIndicadors} = require('../services/inv-indicadors-service');
const {getAllSymbols} = require('../services/inv-symbols-service')
const {Simulate,
    GetAllSimulations,
    UpdateSimulationName,
    DeleteSimulation} = require('../services/inv-simulations-service');
const {StrategyCrud} = require('../services/inv-strategy-service');

class InversionsRoute extends cds.ApplicationService {
    async init(){
        // this.on('getall',async (req)=>{return GetAllPricesHistory(req);});this.on('addone',async (req)=>{return AddOnePricesHistory(req);});
        // this.on('deleteone',async (req)=>{return DeleteOnePricesHistory(req);});
        //Simulacion
        this.on('simulate', async (req) => {
            return Simulate(req);
        });
         this.on('priceshistorycrud', async (req) => {
            return PricesHistoryCrud(req);
        });
        this.on('getallsimulations', async (req) => {
            return GetAllSimulations(req);
        });

        this.on('updatesimulationname', async (req) => {
            return UpdateSimulationName(req);
        });

        this.on('deletesimulation', async (req) => {
            return DeleteSimulation(req);
        });

        //Estrategia CRUD
        this.on('strategy', async (req) => {
            return StrategyCrud(req);
        });

        //Indicadores
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