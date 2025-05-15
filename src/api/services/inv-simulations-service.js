const Simulation = require('../models/mongodb/simulations');
const Indicator = require('../models/mongodb/indicadors');
const { v4: uuidv4 } = require("uuid");
const { calculateIndicators } = require('../utils/indicadors');

// POST SIMULATION (no me jaló, me quebré la cabeza pero no le supe ayuda)
async function Simulate(req) {
  try {
    const simData = req.req.body.simulation;
    if (!simData || !simData.symbol || !simData.idUser || !simData.idStrategy || !simData.simulationName) {
      throw new Error("Faltan datos obligatorios para la simulación.");
    }

    // 1. Obtener histórico de precios e indicadores
    // Busca el documento de indicadores para el símbolo y el intervalo
    const indicadorDoc = await Indicator.findOne({
      symbol: simData.symbol,
      interval: simData.interval || "daily"
    }).lean();

    if (!indicadorDoc) {
      throw new Error("No se encontraron indicadores para el símbolo/intervalo especificado.");
    }

    // 2. Ejecutar la lógica de simulación (ejemplo simple: generar señales cuando RSI < 30 o RSI > 70)
    const signals = [];
    const data = indicadorDoc.data || [];
    for (const point of data) {
      if (point.RSI !== undefined && point.RSI !== null) {
        if (point.RSI < 30) {
          signals.push({
            date: point.date,
            type: "BUY",
            price: point.close,
            reasoning: "RSI < 30"
          });
        } else if (point.RSI > 70) {
          signals.push({
            date: point.date,
            type: "SELL",
            price: point.close,
            reasoning: "RSI > 70"
          });
        }
      }
    }

    // 3. Crear el documento de simulación
    const now = new Date();
    const simulationDoc = new Simulation({
      idSimulation: uuidv4(),
      idUser: simData.idUser,
      idStrategy: simData.idStrategy,
      simulationName: simData.simulationName,
      symbol: simData.symbol,
      startDate: simData.startDate,
      endDate: simData.endDate,
      amount: simData.amount,
      specs: simData.specs || "",
      signals: signals,
      DETAIL_ROW: {
        ACTIVED: true,
        DELETED: false,
        DETAIL_ROW_REG: [{
          CURRENT: true,
          REGDATE: now,
          REGTIME: now,
          REGUSER: simData.idUser
        }]
      }
    });

    // 4. Guardar en MongoDB
    const saved = await simulationDoc.save();

    // 5. Retornar el resultado
    return {
      message: "Simulación creada y ejecutada correctamente.",
      simulation: JSON.parse(JSON.stringify(saved))
    };
  } catch (error) {
    return { error: error.message };
  }
}//CHECHO



// GET ALL/ONE simulation(s)
async function GetAllSimulations(req) {
  try {
    const SID = req?.req?.query.SIMULATIONID;
    let simulations = [];

    if (SID) {
      simulations = await Simulation.findOne({ idSimulation: SID }).lean();
    } else {
      simulations = await Simulation.find().lean();
    }

    return {
      simulations
    };
  } catch (error) {
    return { error: error.message };
  }
}


// UPDATE SIMULATION (Yuo can update just the name)
async function UpdateSimulationName(req) {
  try {
    const SID = req.req.query?.SIMULATIONID;
    const simulationData = req.req.body.simulation;

    if (!SID) {
      throw new Error("El campo 'SIMULATIONID' es obligatorio para actualizar una simulación.");
    }

    if (!simulationData || !simulationData.simulationName) {
      throw new Error("El campo 'simulationName' es obligatorio en el body.");
    }

    // Buscar simulación activa existente
    const simulation = await Simulation.findOne({
      idSimulation: SID,
      "DETAIL_ROW.ACTIVED": true
    });

    if (!simulation) {
      throw new Error(`Simulación no encontrada o inactiva: ${SID}`);
    }

    // Marcar todos los registros previos como CURRENT: false
    simulation.DETAIL_ROW.DETAIL_ROW_REG.forEach(reg => reg.CURRENT = false);

    // Agregar nuevo registro de auditoría
    const now = new Date();
    simulation.DETAIL_ROW.DETAIL_ROW_REG.push({
      CURRENT: true,
      REGDATE: now,
      REGTIME: now,
      REGUSER: "SYSTEM" // Puedes pasar esto desde el frontend
    });

    // Actualizar el nombre
    simulation.simulationName = simulationData.simulationName;

    const updatedSimulation = await simulation.save();

    return {
      message: "Simulación actualizada correctamente.",
      simulation: JSON.parse(JSON.stringify(updatedSimulation))
    };

  } catch (error) {
    return { error: error.message };
  }
}

// DELETE SIMULATION
  async function DeleteSimulation (req) {
    try {
      const SID = req.req.query?.SIMULATIONID;
  
      if (!SID) {
        throw new Error("Se requiere el SIMULATIONID para eliminar la simulación.");
      }
  
      const deletedSimulation = await Simulation.findOneAndDelete({ idSimulation: SID });
  
      if (!deletedSimulation) {
        throw new Error(`No se encontró una simulación con IdSimulacion '${SID}' para eliminar.`);
      }
  
      return {
        message: `Simulacion '${SID}' eliminada de la base de datos.`,
        deletedSimulation: JSON.parse(JSON.stringify(deletedSimulation))
      };
  
    } catch (error) {
      return { error: error.message };
    }
  }

module.exports={
    Simulate,
    GetAllSimulations,
    UpdateSimulationName,
    DeleteSimulation
}