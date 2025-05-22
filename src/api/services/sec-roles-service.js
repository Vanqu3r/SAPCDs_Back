const RoleSchema = require('../models/mongodb/ztroles');
const ValueSchema = require('../models/mongodb/ztvalues');
const RolesInfoSchema = require('../models/mongodb/getRolesModel');
const RolesInfoUsers = require('../models/mongodb/getRolesUsersModel');

async function RolesCRUD(req) {
  try {
    const { procedure, type, roleid } = req.req.query;
    const currentUser = req.req?.query?.USERID || 'SYSTEM';
    const body = req.req.body;
    let result;

    const validarProcessIds = async (privilegios = []) => {
      const processIds = (privilegios || []).map(p =>
        p.PROCESSID.replace('IdProcess-', '').trim()
      );

      const procesosValidos = await ValueSchema.find({
        LABELID: 'IdProcesses',
        VALUEID: { $in: processIds }
      }).lean();

      if (procesosValidos.length !== processIds.length) {
        const encontrados = procesosValidos.map(p => p.VALUEID);
        const faltantes = processIds.filter(id => !encontrados.includes(id));
        throw new Error(`No existe el siguiente proceso en la Base de Datos: ${faltantes.join(', ')}`);
      }
    };

    switch (procedure) {
      case 'get':
        switch (type) {
          case 'all':
            result = await RolesInfoSchema.find().lean();
            console.log('ROLES FIND RESULT:', result);  // Asegúrate que realmente tenga data
            break;
          case 'users':
            const filter = roleid ? { ROLEID: roleid } : {};
            result = await RolesInfoUsers.find(filter).lean();
            break;
          default:
            throw new Error('Tipo inválido en GET');
        }
        break;

      case 'post':
        await validarProcessIds(body.PRIVILEGES);
        const nuevoRol = await RoleSchema.create(body);
        result = nuevoRol.toObject();
        break;

      case 'put':
        if (!roleid) throw new Error('Parametro faltante (RoleID)');
        const updateData = body;
        if (!updateData || Object.keys(updateData).length === 0) {
          throw new Error('No se proporcionan campos para actualizar');
        }

        const roleToUpdate = await RoleSchema.findOne({ ROLEID: roleid });
        if (!roleToUpdate) throw new Error('El rol a actualizar no existe');

        if (updateData.PRIVILEGES) {
          await validarProcessIds(updateData.PRIVILEGES);
        }

        const nowPut = new Date();
        if (!roleToUpdate.DETAIL_ROW) {
          roleToUpdate.DETAIL_ROW = { ACTIVED: true, DELETED: false, DETAIL_ROW_REG: [] };
        }

        if (Array.isArray(roleToUpdate.DETAIL_ROW.DETAIL_ROW_REG)) {
          roleToUpdate.DETAIL_ROW.DETAIL_ROW_REG.forEach(reg => {
            if (reg.CURRENT) reg.CURRENT = false;
          });
        } else {
          roleToUpdate.DETAIL_ROW.DETAIL_ROW_REG = [];
        }

        roleToUpdate.DETAIL_ROW.DETAIL_ROW_REG.push({
          CURRENT: true,
          REGDATE: nowPut,
          REGTIME: nowPut,
          REGUSER: currentUser
        });

        Object.assign(roleToUpdate, updateData);
        const updatedRole = await roleToUpdate.save();
        result = updatedRole.toObject();
        break;

      case 'delete':
        if (!roleid) throw new Error('Parametro faltante (RoleID)');

        switch (type) {
          case 'logic':
            const roleToLogicDelete = await RoleSchema.findOne({ ROLEID: roleid });
            if (!roleToLogicDelete) throw new Error('No se encontró ningún rol');

            const nowDel = new Date();
            if (!roleToLogicDelete.DETAIL_ROW) {
              roleToLogicDelete.DETAIL_ROW = { ACTIVED: true, DELETED: false, DETAIL_ROW_REG: [] };
            }

            if (Array.isArray(roleToLogicDelete.DETAIL_ROW.DETAIL_ROW_REG)) {
              roleToLogicDelete.DETAIL_ROW.DETAIL_ROW_REG.forEach(reg => {
                if (reg.CURRENT) reg.CURRENT = false;
              });
            } else {
              roleToLogicDelete.DETAIL_ROW.DETAIL_ROW_REG = [];
            }

            roleToLogicDelete.DETAIL_ROW.ACTIVED = false;
            roleToLogicDelete.DETAIL_ROW.DELETED = true;
            roleToLogicDelete.DETAIL_ROW.DETAIL_ROW_REG.push({
              CURRENT: true,
              REGDATE: nowDel,
              REGTIME: nowDel,
              REGUSER: currentUser
            });

            const logicDeleted = await roleToLogicDelete.save();
            result = logicDeleted.toObject();
            break;

          case 'hard':
            const hardDeleted = await RoleSchema.deleteOne({ ROLEID: roleid });
            if (hardDeleted.deletedCount === 0) {
              throw new Error('No existe el rol especificado.');
            }
            result = { message: 'Rol eliminado.' };
            break;

          default:
            throw new Error('Tipo inválido en DELETE');
        }
        break;

      default:
        throw new Error('Parámetro "procedure" inválido o no especificado');
    }

    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    console.error('Error en RolesCRUD:', error);
    return { error: true, message: error.message };
  }
}



module.exports = { RolesCRUD };
