const RoleSchema = require('../models/mongodb/ztroles');
const ValueSchema = require('../models/mongodb/ztvalues');

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
        //por si pasa un IDROLE
      const matchStage = roleid ? [{ $match: { ROLEID: roleid } }] : [];

      // CONSULTA PARA ROLES
      const pipelineAll = [
        ...matchStage,
        {
          $unwind: {
            path: "$PRIVILEGES",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: "ZTEVALUES",
            let: { pid: "$PRIVILEGES.PROCESSID" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$LABELID", "IdProcesses"] },
                      {
                        $eq: [
                          "$VALUEID",
                          { $replaceOne: { input: "$$pid", find: "IdProcess-", replacement: "" } }
                        ]
                      }
                    ]
                  }
                }
              }
            ],
            as: "processInfo"
          }
        },
        {
          $unwind: {
            path: "$processInfo",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $set: {
            PROCESSNAME: "$processInfo.VALUE",
            VIEWID: "$processInfo.VALUEPAID"
          }
        },
        {
          $lookup: {
            from: "ZTEVALUES",
            let: { vid: "$VIEWID" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$LABELID", "IdViews"] },
                      {
                        $eq: [
                          "$VALUEID",
                          { $replaceOne: { input: "$$vid", find: "IdViews-", replacement: "" } }
                        ]
                      }
                    ]
                  }
                }
              }
            ],
            as: "viewInfo"
          }
        },
        {
          $unwind: {
            path: "$viewInfo",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $set: {
            VIEWNAME: "$viewInfo.VALUE",
            APPLICATIONID: "$viewInfo.VALUEPAID"
          }
        },
        {
          $lookup: {
            from: "ZTEVALUES",
            let: { aid: "$APPLICATIONID" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$LABELID", "IdApplications"] },
                      {
                        $eq: [
                          "$VALUEID",
                          { $replaceOne: { input: "$$aid", find: "IdApplications-", replacement: "" } }
                        ]
                      }
                    ]
                  }
                }
              }
            ],
            as: "appInfo"
          }
        },
        {
          $unwind: {
            path: "$appInfo",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $set: {
            APPLICATIONNAME: "$appInfo.VALUE"
          }
        },
        {
          $unwind: {
            path: "$PRIVILEGES.PRIVILEGEID",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: "ZTEVALUES",
            let: { prid: "$PRIVILEGES.PRIVILEGEID" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$LABELID", "IdPrivileges"] },
                      { $eq: ["$VALUEID", "$$prid"] }
                    ]
                  }
                }
              }
            ],
            as: "privInfo"
          }
        },
        {
          $unwind: {
            path: "$privInfo",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $group: {
            _id: {
              ROLEID: "$ROLEID",
              ROLENAME: "$ROLENAME",
              DESCRIPTION: "$DESCRIPTION",
              PROCESSID: "$processInfo.VALUEID",
              PROCESSNAME: "$PROCESSNAME",
              VIEWID: "$viewInfo.VALUEID",
              VIEWNAME: "$VIEWNAME",
              APPLICATIONID: "$appInfo.VALUEID",
              APPLICATIONNAME: "$appInfo.VALUE"
            },
            PRIVILEGES: {
              $push: {
                PRIVILEGEID: "$PRIVILEGES.PRIVILEGEID",
                PRIVILEGENAME: "$privInfo.VALUE"
              }
            },
            DETAIL_ROW: { $first: "$DETAIL_ROW" }
          }
        },
        {
          $group: {
            _id: {
              ROLEID: "$_id.ROLEID",
              ROLENAME: "$_id.ROLENAME",
              DESCRIPTION: "$_id.DESCRIPTION"
            },
            PROCESSES: {
              $push: {
                PROCESSID: "$_id.PROCESSID",
                PROCESSNAME: "$_id.PROCESSNAME",
                VIEWID: "$_id.VIEWID",
                VIEWNAME: "$_id.VIEWNAME",
                APPLICATIONID: "$_id.APPLICATIONID",
                APPLICATIONNAME: "$_id.APPLICATIONNAME",
                PRIVILEGES: "$PRIVILEGES"
              }
            },
            DETAIL_ROW: { $first: "$DETAIL_ROW" }
          }
        },
        {
          $lookup: {
            from: "ZTEUSERS",
            let: { roleId: "$_id.ROLEID" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ["$$roleId", "$ROLES.ROLEID"]
                  }
                }
              },
              {
                $project: {
                  _id: 0,
                  USERID: 1,
                  USERNAME: 1,
                  COMPANYNAME: 1,
                  DEPARTMENT: 1,
                  EMPLOYEEID: 1
                }
              }
            ],
            as: "USERS"
          }
        },
        {
          $project: {
            _id: 0,
            ROLEID: "$_id.ROLEID",
            ROLENAME: "$_id.ROLENAME",
            DESCRIPTION: "$_id.DESCRIPTION",
            PROCESSES: {
              $filter: {
                input: "$PROCESSES",
                as: "proc",
                cond: { $ne: ["$$proc.PROCESSID", null] }
              }
            },
            USERS: 1,
            DETAIL_ROW: 1
          }
        }
      ];


      result = await RoleSchema.aggregate(pipelineAll);


      // GET CON USERS ----------------------------------
    } else if (procedure === 'get' && type === 'users') {
      //por si pasa un IDROLE
      const matchStage = roleid ? [{ $match: { ROLEID: roleid } }] : [];

      // CONSULTA PARA ROLES-USUARIOS
      const pipelineUsers = [
        ...matchStage,
        {
          $lookup: {
            from: "ZTEUSERS",
            let: {
              roleId: "$ROLEID"
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ["$$roleId", "$ROLES.ROLEID"]
                  }
                }
              },
              {
                $project: {
                  _id: 0,
                  USERID: 1,
                  USERNAME: 1,
                  COMPANYNAME: 1,
                  DEPARTMENT: 1,
                  EMPLOYEEID: 1
                }
              }
            ],
            as: "USERS"
          }
        },
        {
          $project: {
            _id: 0,
            ROLEID: 1,
            ROLENAME: 1,
            DESCRIPTION: 1,
            USERS: 1,
            DETAIL_ROW: 1
          }
        }
      ]

      result = await RoleSchema.aggregate(pipelineUsers);


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

      const camposActualizar = req.req.body;

      if (!camposActualizar || Object.keys(camposActualizar).length === 0) {
        throw new Error('No se proporcionan campos para actualizar');
      }

      //SI HAY PRIVILEGIOS A ACTUALIZAR SE LLAMA LA FUNCION PARA VALIDAR ESA COSA
      if (camposActualizar.PRIVILEGES) {
        await validarProcessIds(camposActualizar.PRIVILEGES);
      }

      const existing = await RoleSchema.findOne({ ROLEID: roleid });
      if (!existing) throw new Error('No se encontró el rol para actualizar');


      // Actualizar campos manualmente
      Object.assign(existing, camposActualizar);

      // Actualizar el registro de la actualización
      const now = new Date();
      const reguser = req.req.user?.USERNAME || 'SYSTEM';

      // Marcar registros anteriores como no actuales
      if (Array.isArray(existing.DETAIL_ROW.DETAIL_ROW_REG)) {
        existing.DETAIL_ROW.DETAIL_ROW_REG.forEach(reg => {
          reg.CURRENT = false;
        });
      } else {
        existing.DETAIL_ROW.DETAIL_ROW_REG = [];
      }

      // Agregar nuevo registro
      existing.DETAIL_ROW.DETAIL_ROW_REG.push({
        CURRENT: true,
        REGDATE: now,
        REGTIME: now,
        REGUSER: reguser
      });

      // Guardar con validaciones y middleware
      const updated = await existing.save();
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
