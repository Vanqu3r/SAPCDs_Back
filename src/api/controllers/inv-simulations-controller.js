const cds = require('@sap/cds');
const { GetAllSimulations, UpdateSimulationName, DeleteSimulation} = require('../services/inv-simulations-service');

class SimulationsController extends cds.ApplicationService {
    async init() {

        this.on('getallsimulations', async (req) => {
            return GetAllSimulations(req);
        });

        this.on('updatesimulationname', async (req) => {
            return UpdateSimulationName(req);
        });

        this.on('deletesimulation', async (req) => {
            return DeleteSimulation(req);
        });

        return await super.init();
    }
};

module.exports = SimulationsController;
