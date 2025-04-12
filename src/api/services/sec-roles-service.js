const RoleSchema = require('../models/mongodb/ztroles');
const ValueSchema = require('../models/mongodb/ztvalues');
const RolesInfoSchema = require('../models/mongodb/getRolesModel');
const RolesInfoUsers = require('../models/mongodb/getRolesUsersModel');

async function RolesCRUD(req) {
  try {
    const { procedure, type } = req.req.query;
    console.log('PROCEDURE:', procedure, 'TYPE:', type);

    let result;

    if (procedure === 'get' && type === 'all') {
      result = await RolesInfoSchema.find().lean();


    } else if (procedure === 'get' && type === 'users') {
      result = await RolesInfoUsers.find().lean();


    } else if (procedure === 'post') {
      const nuevoRol = req.req.body;

      const processIds = (nuevoRol.PRIVILEGES || []).map(p =>
        p.PROCESSID.replace('IdProcess-', '').trim()
      );
      
      console.log('processID:', processIds);
     
      const procesosValidos = await ValueSchema.find({
        LABELID: "IdProcesses",
        VALUEID: { $in: processIds }
      }).lean();

      if (procesosValidos.length !== processIds.length) {
        const encontrados = procesosValidos.map(p => p.VALUEID);
        const faltantes = processIds.filter(id => !encontrados.includes(id));

        throw new Error(`Los siguientes PROCESSID no existen: ${faltantes.join(', ')}`);
      }

      const nuevoRolito = await RoleSchema.create(nuevoRol); 
      result = nuevoRolito.toObject(); 

    } else {
      console.log('No coincide ningún if');
    }

    return result;
  } catch (error) {
    console.error('Error en RolesCRUD:', error);
    return { error: true, message: error.message };
  }
}

module.exports = { RolesCRUD };
