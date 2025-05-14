const Simulation = require('../models/mongodb/simulations');
const Indicator = require('../models/mongodb/indicadors');
const { v4: uuidv4 } = require("uuid");

// POST SIMULATION (no me jaló, me quebré la cabeza pero no le supe ayuda)
async function Simulate(req) {
  
}



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