const cds = require("@sap/cds");
//const {GetAllPricesHistory,AddOnePricesHistory,DeleteOnePricesHistory} = require('../services/inv-priceshistory-service');
const { PricesHistoryCrud } = require("../services/inv-priceshistory-service");
const { getIndicadors } = require("../services/inv-indicadors-service");
const { getAllSymbols } = require("../services/inv-symbols-service");
const {
  Simulate,
  GetAllSimulations,
  UpdateSimulationName,
  DeleteSimulation,
} = require("../services/inv-simulations-service");
const { StrategyCrud } = require("../services/inv-strategy-service");
const { simulationCRUD } = require("../services/inv-CrudSimulation")
const {
  SimulateMomentum,
  simulateSupertrend,
  reversionSimple,
  SimulateMACrossover,
} = require("../services/inv-simulation-service");

class InversionsRoute extends cds.ApplicationService {
  async init() {
    this.on("simulation", async (req) => {
      try {
        // Extraer 'strategy' de los query params y datos del body
        // Asegúrate de que 'req.req.query' y 'req.req.body.simulation' son las rutas correctas
        // para acceder a estos datos en tu entorno CDS.
        const { strategy } = req?.req?.query || {};
        const body = req?.req?.body?.SIMULATION || {}; // Aquí está todo el body

        // Validaciones
        if (!strategy) {
          throw new Error(
            "Falta el parámetro requerido: 'strategy' en los query parameters."
          );
        }
        if (Object.keys(body).length === 0) {
          throw new Error(
            "El cuerpo de la solicitud no puede estar vacío. Se esperan parámetros de simulación."
          );
        }

        // Switch para manejar diferentes estrategias
        switch (strategy.toLowerCase()) {
          case "reversionsimple":
            return await reversionSimple(body);
          case "momentum":
            return await SimulateMomentum(body);
          case "supertrend":
            return await simulateSupertrend(body);
          case "macrossover":
            return await SimulateMACrossover(body);
          default:
            throw new Error(`Estrategia no reconocida: ${strategy}`);
        }
      } catch (error) {
        console.error("Error en el controlador de simulación:", error);
        // Retorna un objeto de error que el framework pueda serializar a JSON.
        return {
          ERROR: true,
          MESSAGE:
            error.message || "Error al procesar la solicitud de simulación.",
        };
      }
    });
    //pricesHistory
    this.on("priceshistorycrud", async (req) => {
      const { procedure, strategy, symbol } = req.req.query;
      if (!procedure || !symbol) {
        return { message: "Faltan parametros importantes" };
      } else {
        return PricesHistoryCrud(req);
      }
    });
    //Estrategia CRUD
    this.on("strategy", async (req) => {
      return StrategyCrud(req);
    });

    //Indicadores
    this.on("indicators", async (req) => {
      const { procedure, strategy, symbol } = req.req.query;
      if (!procedure || !strategy || !symbol) {
        return { message: "Faltan parametros importantes" };
      } else {
        return getIndicadors(req);
      }
    });

    //Symbols
    this.on("company", async (req) => {
      return getAllSymbols(req);
    });

    //Simulation crud
        this.on('simulationCrud', async (req) => {
            return simulationCRUD(req);
        });


    //more functions
    return await super.init();
  }
}
module.exports = InversionsRoute;
