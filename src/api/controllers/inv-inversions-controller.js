const cds = require('@sap/cds');
//const {GetAllPricesHistory,AddOnePricesHistory,DeleteOnePricesHistory} = require('../services/inv-priceshistory-service');
const { PricesHistoryCrud } = require('../services/inv-priceshistory-service');
const { getIndicadors } = require('../services/inv-indicadors-service');
const { getAllSymbols } = require('../services/inv-symbols-service')
const { Simulate,
    GetAllSimulations,
    UpdateSimulationName,
    DeleteSimulation } = require('../services/inv-simulations-service');
const { StrategyCrud } = require('../services/inv-strategy-service');
const { SimulateMomentum } = require('../services/inv-simulation-service');

class InversionsRoute extends cds.ApplicationService {
    async init() {
        // this.on('getall',async (req)=>{return GetAllPricesHistory(req);});this.on('addone',async (req)=>{return AddOnePricesHistory(req);});
        // this.on('deleteone',async (req)=>{return DeleteOnePricesHistory(req);});
        //Simulacion
        /* this.on('simulate', async (req) => {
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
         });*/

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
                        // Llama a la función reversionSimple con el objeto 'body' directamente.
                        // 'reversionSimple' ya devuelve un objeto JavaScript.
                       // const result = await reversionSimple(body);
                        // NO uses JSON.parse(result) aquí, porque 'result' ya es un objeto.
                        // El framework se encargará de serializarlo a JSON para la respuesta HTTP.
                        return result; // <-- ¡Esta es la corrección clave!
                    case "momentum":
                        return await SimulateMomentum(body);

                    // Aquí puedes agregar más estrategias en el futuro:
                    // case 'otraEstrategia':
                    //   return await otraFuncionDeEstrategia(body);

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