const simulationModel = require('../models/mongodb/simulations');
const Portafolio = require("../models/mongodb/portafolio");
const portafolio = require('../models/mongodb/portafolio');

async function simulationCRUD(req) {
    if (!req || !req.req) {
        return { status: 400, error: 'Request inválida' };
    }

    const { query } = req.req;
    const data = req.data;
    const procedure = query?.procedure;
    const RegUser = query?.RegUser;
    console.log(data);

    if (!procedure) {
        return { status: 400, error: 'Parámetro "procedure" es requerido en query' };
    }
    if (!RegUser) {
        return { status: 400, error: 'RegUser es requerido para esta operación' };
    }

    try {
        switch (procedure.toLowerCase()) {
            case 'getall': {
                const results = await simulationModel.find({ USERID: RegUser }).lean();
                if (!results || results.length === 0) {
                    return { status: 404, message: 'No se encontraron simulaciones para este usuario' };
                }
                return results;
            }

            case 'getone': {
                const simulationName = query?.simulationName;
                if (!simulationName) {
                    return { status: 400, error: 'Nombre de simulación requerido' };
                }

                const results = await simulationModel.findOne({ SIMULATIONNAME: simulationName, USERID: RegUser }).lean();
                if (!results) {
                    return { status: 404, error: 'Simulación no encontrada para este usuario' };
                }
                return results;
            }

            case 'getbyrangedate': {
                const { startDate, endDate } = query;
                if (!startDate || !endDate) {
                    return { status: 400, error: 'startDate y endDate son requeridos' };
                }

                const results = await simulationModel.find({
                    USERID: RegUser,
                    STARTDATE: { $gte: new Date(startDate) },
                    ENDDATE: { $lte: new Date(endDate) }
                }).lean();

                if (!results || results.length === 0) {
                    return { status: 404, message: 'No se encontraron simulaciones en ese rango para este usuario' };
                }

                return results;
            }

            case 'getbyrangeinv': {
                const minAmount = parseFloat(query?.minAmount);
                const maxAmount = parseFloat(query?.maxAmount);

                if (isNaN(minAmount)) {
                    return { status: 400, error: 'minAmount debe ser un número válido' };
                }

                // Inicializa correctamente el objeto de rango
                const amountFilter = { $gte: minAmount };
                if (!isNaN(maxAmount)) {
                    amountFilter.$lte = maxAmount;
                }

                // Aplica filtro completo
                const filter = {
                    USERID: RegUser,
                    AMOUNT: amountFilter
                };

                const results = await simulationModel.find(filter).lean();

                if (!results || results.length === 0) {
                    return {
                        status: 404,
                        message: 'No se encontraron simulaciones en ese rango de inversión para este usuario'
                    };
                }

                return results;
            }


            case 'getbyreturn': {
                const minReturn = parseFloat(query?.minReturn);

                if (isNaN(minReturn)) {
                    return { status: 400, error: 'minReturn debe ser un número válido' };
                }

                const results = await simulationModel.find({
                    USERID: RegUser,
                    'SUMMARY.REAL_PROFIT': { $gte: minReturn }
                }).lean();

                if (!results || results.length === 0) {
                    return { status: 404, message: 'No se encontraron simulaciones con ese rendimiento para este usuario' };
                }

                return results;
            }

            case 'update': {
                const id = query.simulationId;
                if (!id) {
                    return { status: 400, error: 'ID es requerido para actualización' };
                }

                if (!data || Object.keys(data).length === 0) {
                    return { status: 400, error: 'Datos de actualización son requeridos' };
                }

                const allowedFields = ['SIMULATIONNAME'];
                const invalidFields = Object.keys(data).filter(key => !allowedFields.includes(key));

                if (invalidFields.length > 0) {
                    return {
                        status: 400,
                        error: `Solo se permite actualizar el campo SIMULATIONNAME. Campos no permitidos: ${invalidFields.join(', ')}`
                    };
                }

                // 1. Obtener la simulación actual
                const simulation = await simulationModel.findOne({
                    SIMULATIONID: id,
                    USERID: RegUser
                });
                if (!simulation) throw { status: 404, message: 'Simulación no encontrada' };

                // Preparar la nueva entrada de auditoría
                const newAuditRecord = {
                    CURRENT: true,
                    REGDATE: new Date().toISOString().slice(0, 10),
                    REGTIME: new Date().toTimeString().slice(0, 8),
                    REGUSER: RegUser
                };

                // Asegurar estructura de DETAIL_ROW
                if (!simulation.DETAIL_ROW) {
                    simulation.DETAIL_ROW = {
                        ACTIVED: true,
                        DELETED: false,
                        DETAIL_ROW_REG: []
                    };
                }

                // Marcar registros actuales como no actuales
                if (Array.isArray(simulation.DETAIL_ROW.DETAIL_ROW_REG)) {
                    simulation.DETAIL_ROW.DETAIL_ROW_REG.forEach(reg => reg.CURRENT = false);
                } else {
                    simulation.DETAIL_ROW.DETAIL_ROW_REG = [];
                }

                // Agregar nuevo registro de auditoría
                simulation.DETAIL_ROW.DETAIL_ROW_REG.push(newAuditRecord);

                // Actualizar nombre
                simulation.SIMULATIONNAME = data.SIMULATIONNAME;

                // Guardar cambios
                await simulation.save();
                return { status: 200, data: simulation.toObject() };
            }


            case 'delete': {
                const id = query.simulationId;
                if (!id) {
                    return { status: 400, error: 'ID es requerido para eliminación' };
                }

                const simulation = await simulationModel.findOne({
                    SIMULATIONID: id,
                    USERID: RegUser
                });
                if (!simulation) {
                    return { status: 404, error: 'Simulación no encontrada para eliminación o Usuario no autorizado' };
                }

                await simulationModel.findByIdAndDelete(simulation._id);
                return { status: 200, message: 'Simulación eliminada correctamente' };
            }

            default:
                return { status: 400, error: `Procedimiento no reconocido: ${procedure}` };
        }
    } catch (error) {
        console.error('Error en simulationCRUD:', error.message);
        return { status: 500, error: 'Error interno del servidor', details: error.message };
    }
}

async function History(req) {
    if (!req || !req.req) {
        return { status: 400, error: 'Request inválida' };
    }

    const { query } = req.req;
    const id = query?.userId
    
    try {
        
        const results = await portafolio.find({ USERID: id }).lean();        
                if (!results || results.length === 0) {
                    return { status: 404, message: 'No se encontraron simulaciones para este usuario' };
                }
                return results;
    } catch (error) {
        return { status: 500, error: 'Error interno del servidor', details: error.message };
    }

}



module.exports = {
    simulationCRUD,
    History
};
