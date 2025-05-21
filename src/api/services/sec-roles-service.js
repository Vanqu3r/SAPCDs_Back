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

        // Buscar rol actual
        const role = await RoleSchema.findOne({ ROLEID: roleid });
        if (!role) throw new Error('No se encontró ningún rol');

        if (!role.DETAIL_ROW) {
          role.DETAIL_ROW = { ACTIVED: true, DELETED: false, DETAIL_ROW_REG: [] };
        }

        const now = new Date();
        const currentUser = req.req.query?.user?.USERID || 'SYSTEM';

        if (Array.isArray(role.DETAIL_ROW.DETAIL_ROW_REG)) {
            role.DETAIL_ROW.DETAIL_ROW_REG.forEach(reg => {
              if (reg.CURRENT) reg.CURRENT = false;
          });
        } else {
          role.DETAIL_ROW.DETAIL_ROW_REG = [];
        }

        // Marcar borrado lógico
        role.DETAIL_ROW.ACTIVED = false;
        role.DETAIL_ROW.DELETED = true;

        // Agregar nuevo registro en DETAIL_ROW_REG
        role.DETAIL_ROW.DETAIL_ROW_REG.push({
            CURRENT: true,
            REGDATE: now,
            REGTIME: now,
            REGUSER: currentUser
        });

        const updated = await role.save();
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

      const role = await RoleSchema.findOne({ ROLEID: roleid });

      if(!role) throw new Error('El rol a actualizar no existe');
      
      //SI HAY PRIVILEGIOS A ACTUALIZAR SE LLAMA LA FUNCION PARA VALIDAR ESA COSA
      if (camposActualizar.PRIVILEGES) {
        await validarProcessIds(camposActualizar.PRIVILEGES);
      }

      // Desactivar el registro CURRENT actual en DETAIL_ROW_REG
      if (!role.DETAIL_ROW) {
          role.DETAIL_ROW = { ACTIVED: true, DELETED: false, DETAIL_ROW_REG: [] };
      }

      const now = new Date();
      const currentUser = req.req?.query?.USERID || 'SYSTEM';

      if (Array.isArray(role.DETAIL_ROW.DETAIL_ROW_REG)) {
          role.DETAIL_ROW.DETAIL_ROW_REG.forEach(reg => {
              if (reg.CURRENT) reg.CURRENT = false;
          });
      } else {
          role.DETAIL_ROW.DETAIL_ROW_REG = [];
      }

      // Agregar nuevo registro en DETAIL_ROW_REG
      role.DETAIL_ROW.DETAIL_ROW_REG.push({
          CURRENT: true,
          REGDATE: now,
          REGTIME: now,
          REGUSER: currentUser
      });

      
        // Aplicar cambios recibidos
        Object.assign(role, camposActualizar);

        const updated = await role.save();
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
