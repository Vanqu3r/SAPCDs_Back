const RoleSchema = require('../models/mongodb/ztroles');
const ValueSchema = require('../models/mongodb/ztvalues');
const RolesInfoSchema = require('../models/mongodb/getRolesModel');
const RolesInfoUsers = require('../models/mongodb/getRolesUsersModel');

async function RolesCRUD(req) {
  try {
    const { procedure, type, roleid } = req.req.query;
    console.log('PROCEDURE:', procedure, 'TYPE:', type);

    let result;


    //FUNCION PARA VALDIAR PROCESSID
    const validarProcessIds = async (privilegios = []) => {
      const processIds = (privilegios || []).map(p =>
        p.PROCESSID.replace('IdProcess-', '').trim()
      );

      const procesosValidos = await ValueSchema.find({
        LABELID: "IdProcesses",
        VALUEID: { $in: processIds }
      }).lean();

      if (procesosValidos.length !== processIds.length) {
        const encontrados = procesosValidos.map(p => p.VALUEID);
        const faltantes = processIds.filter(id => !encontrados.includes(id));

        throw new Error(`No existe el siguiente proceso en la Base de Datos: ${faltantes.join(', ')}`);
      }
    };



    // GET ALL ------------------------------------
    if (procedure === 'get' && type === 'all') {
      result = await RolesInfoSchema.find().lean();



      // GET CON USERS ----------------------------------
    } else if (procedure === 'get' && type === 'users') {
      result = await RolesInfoUsers.find().lean();


      // POST -------------------------------------
    } else if (procedure === 'post') {
      
      const nuevoRol = req.req.body;
      await validarProcessIds(nuevoRol.PRIVILEGES);

      const nuevoRolito = await RoleSchema.create(nuevoRol);
      result = nuevoRolito.toObject();



      // DELETE ----------------------------
    } else if (procedure === 'delete') {
      if (!roleid) throw new Error('Parametro faltante (RoleID)');


      //DELETE LOGICO
      if (type === 'logic') {

        updated = await RoleSchema.findOneAndUpdate(
          { ROLEID: roleid },
          {
            $set: { 'DETAIL_ROW.ACTIVED': false,  'DETAIL_ROW.DELETED': true }
          },
          { new: true }
        );

        if (!updated) throw new Error('No existe el rol especificado.');
        result = updated.toObject();

        console.log('Rol desactivado');



        //DELETE FISICO
      } else if (type === 'hard') {

        const deleted = await RoleSchema.deleteOne({ ROLEID: roleid });

        if (deleted.deletedCount === 0) {
          throw new Error('No existe el rol especificado.');
        }

        result = { message: 'Rol eliminado.' };

      }


      //PUT ----------------------------------------------

    } else if (procedure === 'put') {
      if (!roleid) throw new Error('Parametro faltante (RoleID)');

      const camposActualizar = req.req.body;

      if (!camposActualizar || Object.keys(camposActualizar).length === 0) {
        throw new Error('No se proporcionan campos para actualizar');
      }

      //SI HAY PRIVILEGIOS A ACTUALIZAR SE LLAMA LA FUNCION PARA VALIDAR ESA COSA
      if (camposActualizar.PRIVILEGES) {
        await validarProcessIds(camposActualizar.PRIVILEGES);
      }

      const updated = await RoleSchema.findOneAndUpdate(
        { ROLEID: roleid },
        { $set: camposActualizar },
        { new: true }
      );

      if (!updated) throw new Error('No se encontró el rol para actualizar');

      result = updated.toObject();

    } else {
      console.log('No coincide ningún procedimiento');
      throw new Error('Parámetros inválidos o incompletos');
    }



    return result;

  } catch (error) {
    console.error('Error en RolesCRUD:', error);
    return { error: true, message: error.message };
  }
}

module.exports = { RolesCRUD };
