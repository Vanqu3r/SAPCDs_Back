const invStrategy = require('../models/mongodb/strategyModel');

async function StrategyCrud(req) {
    try {
        const { procedure } = req.req.query;

        if (procedure == "get") {
            const { ID } = req.req.query;

            if (ID) {
                // Buscar una estrategia por su campo ID
                const strategy = await invStrategy.findOne({ ID });

                if (!strategy) {
                    return { status: 404, message: 'Strategy not found' };
                }

                return strategy.toObject();
            } else {
                // Obtener todas las estrategias
                const allStrategies = await invStrategy.find();

                return allStrategies.map(s => s.toObject());
            }
        }

        else if (procedure == "post") {

            const data = req.req.body;
            console.log(data);

            const newStrategy = new invStrategy({
                ID: data.ID,
                NAME: data.NAME,
                DESCRIPTION: data.DESCRIPTION,
                INDICATORS: data.INDICATORS || [],
                DETAILSROW: data.DETAILSROW || []
            });

            const savedStrategy = await newStrategy.save();

            return savedStrategy.toObject();
        } else {
            return { status: 400, message: 'Invalid procedure' };
        }

    } catch (error) {
        console.error(error);
        return { status: 500, message: 'An error occurred while processing the request.', error: error.message };
    }
}

module.exports = { StrategyCrud };
