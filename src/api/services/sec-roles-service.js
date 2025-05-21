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
      const filter = {};
      if (roleid) {
        filter.ROLEID = roleid;
      }

      result = await RolesInfoSchema.find(filter).lean()



      // GET CON USERS ----------------------------------
    } else if (procedure === 'get' && type === 'users') {
      const filter = {};
      if (roleid) {
        filter.ROLEID = roleid;
      }

      result = await RolesInfoUsers.find(filter).lean()


      // POST -------------------------------------
    } else if (req.req.query.procedure === 'post') {

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
            $set: { 'DETAIL_ROW.ACTIVED': false, 'DETAIL_ROW.DELETED': true }
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

      const nuevosCampos = req.req.body;
      if (!nuevosCampos || Object.keys(nuevosCampos).length === 0) {
        throw new Error('No se proporcionan campos para actualizar');
      }

      // Obtener el documento actual
      const roleActual = await RoleSchema.findOne({ ROLEID: roleid });
      if (!roleActual) throw new Error('No se encontró el rol para actualizar');

      // Validar PRIVILEGES si está presente
      if (nuevosCampos.PRIVILEGES) {
        await validarProcessIds(nuevosCampos.PRIVILEGES);
      }

      // Comparar campo por campo para detectar qué cambió
      const camposCambiados = {};
      for (const key in nuevosCampos) {
        const nuevoValor = JSON.stringify(nuevosCampos[key]);
        const valorActual = JSON.stringify(roleActual[key]);

        if (nuevoValor !== valorActual) {
          camposCambiados[key] = nuevosCampos[key];
        }
      }

      if (Object.keys(camposCambiados).length === 0) {
        throw new Error('No hay cambios detectados para actualizar');
      }

      // Agregar registro a DETAIL_ROW.DETAIL_ROW_REG
      const now = new Date();
      const reguser = req.req.user?.email || 'SYSTEM';

      camposCambiados['DETAIL_ROW.DETAIL_ROW_REG'] = [
        ...roleActual.DETAIL_ROW.DETAIL_ROW_REG.map(r => ({ ...r, CURRENT: false })),
        {
          CURRENT: true,
          REGDATE: now,
          REGTIME: now,
          REGUSER: reguser
        }
      ];

      // Ejecutar la actualización
      const updated = await RoleSchema.findOneAndUpdate(
        { ROLEID: roleid },
        { $set: camposCambiados },
        { new: true }
      );

      result = updated.toObject();
    } else {
      console.log('No coincide ningún procedimiento');
      throw new Error('Parámetros inválidos o incompletos');
    }


    return JSON.parse(JSON.stringify(result));

  } catch (error) {
    console.error('Error en RolesCRUD:', error);
    return { error: true, message: error.message };
  }
}



module.exports = { RolesCRUD };
