const Simulation = require('../models/mongodb/simulations');
const Indicator = require('../models/mongodb/indicadors');
const { v4: uuidv4 } = require("uuid");
const { calculateIndicators } = require('../utils/indicadors');

// POST SIMULATION 
async function Simulate(req) {
  try {
    const strategy = req.req.query?.strategy;
    const {symbol,startDate,endDate,amount,amountToBuy,userId,specs} = req.req.body.simulation;
    if (!symbol || !startDate || !endDate || !amount || !userId || !specs) {
      throw new Error("Faltan datos obligatorios para la simulación.");
    }

    // 1. Obtener histórico de precios e indicadores
    // Busca el documento de indicadores para el símbolo y el intervalo
    const indicadorDoc = await Indicator.findOne({
      symbol: symbol
    }).lean();

    //creo que aqui deberia de llamar al metodo de indicadores, para que los agregue y se pueda chambear
    if (!indicadorDoc) { 
      throw new Error("No se encontraron indicadores para el símbolo/intervalo especificado.");
    }

    // 2. Ejecutar la lógica de simulación (ejemplo simple: generar señales cuando RSI < 30 o RSI > 70)
    const signals = [];
    const data = indicadorDoc.data || [];

    const dateStart = new Date(startDate);
    const dateEnd = new Date(endDate);

    let buyConditions =  0;//[]; //Para verfiicar si se cumplen ciertas condiciones para comprar
    let sellConditions = 0;//[]; //Verificar ciertas condiciones para la venta o salida
    let result = 0, earnd = 0, spent = 0; //Resultado global de la simulación, ganancia y gasto para calcular eso
    let opAmount = amount; //Se asigna para trabajar con la cantidad de dinero libremente

    let positions = 0;
    for (const point of data) {
      const pointDate = new Date(point.date);

      if(pointDate < dateStart || pointDate > dateEnd){
        continue;
      }
      let reasonsBuy = ""; //Se concatena el razonamiento en base a las condiciones
      let reasonsSell = "";
      if(point.SHORT > point.LONG){
        reasonsBuy += "SHORT EMA over LONG EMA\n";
        buyConditions++;  //Se concatena la razon y se aumenta la condicion para compra. En los demas IGUAL
      }else if(point.SHORT < point.LONG){
        reasonsSell += "SHORT EMA under LONG EMA\n";
        sellConditions++;
      }
      if(point.MACD && point.MACD.macd > point.MACD.signal){
        reasonsBuy += "MACD over SIGNAL LINE\n";
        buyConditions++;
      }else if(point.MACD && point.MACD.macd < point.MACD.signal){
        reasonsSell += "MACD under SIGNAL LINE\n";
        sellConditions++;
      }
      if (point.RSI < 50) {
        reasonsBuy += "RSI under 50\n";
        buyConditions++;
      } else if (point.RSI > 70) {
        reasonsSell += "RSI above 70\n";
        sellConditions++;
      }
      if (point.ADX > 25) {
        reasonsBuy += "STRONG Trend (ADX > 25)\n";
        buyConditions++;
      } else {
        reasonsSell += "WEAK Trend (ADX <= 25)\n";
        sellConditions++;
      }
      if(point.MOM > 0){
        reasonsBuy += "MOM creciente\n";
        buyConditions++;
      }else if(point.MOM < 0 ){
        reasonsSell += "MOM decreciente";
        sellConditions++;
      }

      console.log("BuyConditions-Eva: ",buyConditions);
      console.log("SellConditions-Eva:",sellConditions);
      if(buyConditions >= 3){ //Aqui es donde realmente compraría o vendería si se cumplieron ciertas condiciones
        spent = point.close * amountToBuy;
        if (opAmount > spent) {
          opAmount = opAmount - spent;
          signals.push({
            date: point.date,
            type: "buy",
            price: point.close,
            reasoning: reasonsBuy
          });
          result -= spent;//Se resta lo gastado para calcular finalmente lo ganado
          positions += amountToBuy; //Se incrementan las posiciones sobre esa empresa
        }
      }else if(sellConditions >= 3){ //Condiciones para la venta, de aqui se sacan las ganancias
        if(positions > amountToBuy){
          earnd = point.close * amountToBuy;
          opAmount = opAmount + earnd;
          signals.push({
            date: point.date,
            type: "sell",
            price: point.close,
            reasoning: reasonsSell
          });
          positions = positions - amountToBuy;//Se decrementan las posiciones sobre esa empresa
        }else{
          earnd = point.close * positions;
          opAmount = opAmount + earnd;
          signals.push({
            date: point.date,
            type: "sell",
            price: point.close,
            reasoning: reasonsSell
          });
          positions = positions - positions;//Se decrementan las posiciones sobre esa empresa
        }
        result += earnd;  //Se suma lo ganado para calcular finalmente la ganancia
      }
      buyConditions = sellConditions = 0;

    }
    earnd = positions *(data[data.length-1].close);
    console.log("Posiciones: ", positions);
    console.log("Ganancias posibles por posiciones:",earnd)
    const percentageReturn = (result+amount)/amount;

    // 3. Crear el documento de simulación
    const now = new Date();
    const simulationDoc = new Simulation({
      idSimulation: userId+"-SIM-",
      userId: userId,
      idStrategy: strategy,
      simulationName: strategy.toUpperCase()+"00",
      symbol: symbol,
      startDate: startDate,
      endDate: endDate,
      amount: amount,
      amountToBuy: amountToBuy,
      specs: specs || "",
      signals: signals,
      result: result,
      percentageReturn: percentageReturn,
      DETAIL_ROW: {
        ACTIVED: true,
        DELETED: false,
        DETAIL_ROW_REG: [{
          CURRENT: true,
          REGDATE: now,
          REGTIME: now,
          REGUSER: userId
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