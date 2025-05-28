const UsersSchema = require('../models/mongodb/ztusers');
const RoleSchema = require('../models/mongodb/ztroles');
// const usersComplete = require('../models/mongodb/usersComplete');

const validarRol = async (roles) => {
    try {
        console.log("Entra a la funcion de validacion");
        if(!roles || roles.length === 0){
            return roles;
        }
        let rolesId = [];
        roles.forEach( r => {
            rolesId.push(r.ROLEID);
        });
        let validation = await RoleSchema.find( {ROLEID:{$in:rolesId}}).lean();

        if(validation.length !== roles.length ){
            console.log('Alguno de los roles ingresados no existe');
            return validation.toObject();
        }else{
            console.log("todos los roles existen");
            return roles;
        }
    } catch (error) {
        throw error;
    }
}

async function UsersCRUD(req) {
    try {
        const {procedure,type,userid} = req.req.query;
        console.log('REQUEST: ',procedure,'TYPE:',type);

        let res;

        //Validacion de la existencia de roles
        switch (procedure) {
            case 'getall':
                //Esto lo voy  cambiar probablemente
                res = GetAllUsers();
                break;
            case 'getone':
                res = GetOneUser(userid);
                break;
            case 'post':
                console.log("Entra al case");
                res = PostUser(req);
                break;
            case 'patch':
                res = UpdateUser(req,userid);
                break;
            case 'delete':
                if(type === 'logic'){
                    res = LogDelete(userid);
                }else if(type === 'hard'){
                    res = HardDelete(userid);
                }
                break;
            default:
                console.log('No coincide ningún procedimiento');
                throw new Error('Parámetros inválidos o incompletos');
        }

        return res;
    } catch (error) {
        console.error('Error en RolesCRUD:', error);
        return { error: true, message: error.message };
    }
}

async function GetAllUsers() {
  try {
    const pipeline = [
      // Desenvuelve el arreglo de roles para que cada documento tenga un rol individual
      {
        "$unwind": {
          "path": "$ROLES",
          "preserveNullAndEmptyArrays": true
        }
      },
      // Lookup en ZTEROLES para enriquecer cada rol a partir de su ROLEID
      {
        "$lookup": {
          "from": "ZTEROLES",
          "let": { "roleId": "$ROLES.ROLEID" },
          "pipeline": [
            {
              "$match": {
                "$expr": { "$eq": [ "$ROLEID", "$$roleId" ] }
              }
            },
            { "$unwind": "$PRIVILEGES" },
            {
              "$lookup": {
                "from": "ZTEVALUES",
                "let": { "rawProcessId": "$PRIVILEGES.PROCESSID" },
                "pipeline": [
                  {
                    "$addFields": {
                      "cleanProcessId": {
                        "$replaceOne": {
                          "input": "$$rawProcessId",
                          "find": "IdProcess-",
                          "replacement": ""
                        }
                      }
                    }
                  },
                  {
                    "$match": {
                      "$expr": {
                        "$and": [
                          { "$eq": [ "$LABELID", "IdProcesses" ] },
                          { "$eq": [ "$VALUEID", "$cleanProcessId" ] }
                        ]
                      }
                    }
                  },
                  {
                    "$project": {
                      "_id": 0,
                      "PROCESSID": "$VALUEID",
                      "PROCESSNAME": "$VALUE",
                      "VIEWID": "$VALUEPAID"
                    }
                  }
                ],
                "as": "processInfo"
              }
            },
            { "$unwind": "$processInfo" },
            {
              "$addFields": {
                "PROCESSNAME": "$processInfo.PROCESSNAME",
                "VIEWID": "$processInfo.VIEWID"
              }
            },
            {
              "$lookup": {
                "from": "ZTEVALUES",
                "let": { "rawViewId": "$VIEWID" },
                "pipeline": [
                  {
                    "$addFields": {
                      "cleanViewId": {
                        "$replaceOne": {
                          "input": "$$rawViewId",
                          "find": "IdViews-",
                          "replacement": ""
                        }
                      }
                    }
                  },
                  {
                    "$match": {
                      "$expr": {
                        "$and": [
                          { "$eq": [ "$LABELID", "IdViews" ] },
                          { "$eq": [ "$VALUEID", "$cleanViewId" ] }
                        ]
                      }
                    }
                  },
                  {
                    "$project": {
                      "_id": 0,
                      "VIEWNAME": "$VALUE",
                      "APPLICATIONID": "$VALUEPAID"
                    }
                  }
                ],
                "as": "viewInfo"
              }
            },
            {
              "$unwind": {
                "path": "$viewInfo",
                "preserveNullAndEmptyArrays": true
              }
            },
            {
              "$addFields": {
                "VIEWNAME": "$viewInfo.VIEWNAME",
                "APPLICATIONID": "$viewInfo.APPLICATIONID"
              }
            },
            {
              "$lookup": {
                "from": "ZTEVALUES",
                "let": { "rawAppId": "$APPLICATIONID" },
                "pipeline": [
                  {
                    "$addFields": {
                      "cleanAppId": {
                        "$replaceOne": {
                          "input": "$$rawAppId",
                          "find": "IdApplications-",
                          "replacement": ""
                        }
                      }
                    }
                  },
                  {
                    "$match": {
                      "$expr": {
                        "$and": [
                          { "$eq": [ "$LABELID", "IdApplications" ] },
                          { "$eq": [ "$VALUEID", "$cleanAppId" ] }
                        ]
                      }
                    }
                  },
                  {
                    "$project": {
                      "_id": 0,
                      "APPLICATIONNAME": "$VALUE"
                    }
                  }
                ],
                "as": "appInfo"
              }
            },
            {
              "$unwind": {
                "path": "$appInfo",
                "preserveNullAndEmptyArrays": true
              }
            },
            {
              "$addFields": {
                "APPLICATIONNAME": "$appInfo.APPLICATIONNAME"
              }
            },
            { "$unwind": "$PRIVILEGES.PRIVILEGEID" },
            {
              "$lookup": {
                "from": "ZTEVALUES",
                "let": { "privilegeId": "$PRIVILEGES.PRIVILEGEID" },
                "pipeline": [
                  {
                    "$match": {
                      "$expr": {
                        "$and": [
                          { "$eq": [ "$LABELID", "IdPrivileges" ] },
                          { "$eq": [ "$VALUEID", "$$privilegeId" ] }
                        ]
                      }
                    }
                  },
                  {
                    "$project": {
                      "_id": 0,
                      "PRIVILEGENAME": "$VALUE"
                    }
                  }
                ],
                "as": "privInfo"
              }
            },
            { "$unwind": "$privInfo" },
            {
              "$addFields": {
                "PRIVILEGES.PRIVILEGENAME": "$privInfo.PRIVILEGENAME"
              }
            },
            // Agrupar los resultados de este lookup para dejar la estructura enriquecida del rol
            {
              "$group": {
                "_id": {
                  "ROLEID": "$ROLEID",
                  "ROLENAME": "$ROLENAME",
                  "DESCRIPTION": "$DESCRIPTION",
                  "PROCESSID": "$processInfo.VALUEID",
                  "PROCESSNAME": "$PROCESSNAME",
                  "VIEWID": "$viewInfo.VALUEID",
                  "VIEWNAME": "$VIEWNAME",
                  "APPLICATIONID": "$appInfo.VALUEID",
                  "APPLICATIONNAME": "$APPLICATIONNAME"
                },
                "PRIVILEGES": {
                  "$push": {
                    "PRIVILEGEID": "$PRIVILEGES.PRIVILEGEID",
                    "PRIVILEGENAME": "$PRIVILEGES.PRIVILEGENAME"
                  }
                }
              }
            },
            {
              "$project": {
                "_id": 0,
                "ROLEID": "$_id.ROLEID",
                "ROLENAME": "$_id.ROLENAME",
                "DESCRIPTION": "$_id.DESCRIPTION",
                "PROCESSES": {
                  "$arrayElemAt": [
                    [{
                      "PROCESSID": "$_id.PROCESSID",
                      "PROCESSNAME": "$_id.PROCESSNAME",
                      "VIEWID": "$_id.VIEWID",
                      "VIEWNAME": "$_id.VIEWNAME",
                      "APPLICATIONID": "$_id.APPLICATIONID",
                      "APPLICATIONNAME": "$_id.APPLICATIONNAME",
                      "PRIVILEGES": "$PRIVILEGES"
                    }], 0
                  ]
                }
              }
            }
          ],
          "as": "enrichedRole"
        }
      },
      // Volvemos a agrupar por usuario para reconstruir el arreglo de roles enriquecidos
      {
        "$group": {
          "_id": "$_id",
          "userData": { "$first": "$$ROOT" },
          "enrichedRoles": { "$push": "$enrichedRole" }
        }
      },
      {
        "$addFields": {
          // Dado que '$enrichedRoles' es un arreglo de arreglos (por cada unwind se crea un array con 1 elemento), 
          // lo aplanamos:
          "userData.ROLES": { "$reduce": {
            "input": "$enrichedRoles",
            "initialValue": [],
            "in": { "$concatArrays": [ "$$value", "$$this" ] }
          } }
        }
      },
      {
        "$replaceRoot": { "newRoot": "$userData" }
      }
    ];

    const allUsers = await UsersSchema.aggregate(pipeline);
    return allUsers;
  } catch (error) {
    console.log("Error en getAllUsers:", error);
    return { error: true, message: error.message };
  }
}


async function GetOneUser(userid) {
  try {
    const pipeline = [
      { "$match": { "USERID": userid } },
      {
        "$unwind": {
          "path": "$ROLES",
          "preserveNullAndEmptyArrays": true
        }
      },
      // Lookup en ZTEROLES para enriquecer cada rol a partir de su ROLEID
      {
        "$lookup": {
          "from": "ZTEROLES",
          "let": { "roleId": "$ROLES.ROLEID" },
          "pipeline": [
            {
              "$match": {
                "$expr": { "$eq": [ "$ROLEID", "$$roleId" ] }
              }
            },
            { "$unwind": "$PRIVILEGES" },
            {
              "$lookup": {
                "from": "ZTEVALUES",
                "let": { "rawProcessId": "$PRIVILEGES.PROCESSID" },
                "pipeline": [
                  {
                    "$addFields": {
                      "cleanProcessId": {
                        "$replaceOne": {
                          "input": "$$rawProcessId",
                          "find": "IdProcess-",
                          "replacement": ""
                        }
                      }
                    }
                  },
                  {
                    "$match": {
                      "$expr": {
                        "$and": [
                          { "$eq": [ "$LABELID", "IdProcesses" ] },
                          { "$eq": [ "$VALUEID", "$cleanProcessId" ] }
                        ]
                      }
                    }
                  },
                  {
                    "$project": {
                      "_id": 0,
                      "PROCESSID": "$VALUEID",
                      "PROCESSNAME": "$VALUE",
                      "VIEWID": "$VALUEPAID"
                    }
                  }
                ],
                "as": "processInfo"
              }
            },
            { "$unwind": "$processInfo" },
            {
              "$addFields": {
                "PROCESSNAME": "$processInfo.PROCESSNAME",
                "VIEWID": "$processInfo.VIEWID"
              }
            },
            {
              "$lookup": {
                "from": "ZTEVALUES",
                "let": { "rawViewId": "$VIEWID" },
                "pipeline": [
                  {
                    "$addFields": {
                      "cleanViewId": {
                        "$replaceOne": {
                          "input": "$$rawViewId",
                          "find": "IdViews-",
                          "replacement": ""
                        }
                      }
                    }
                  },
                  {
                    "$match": {
                      "$expr": {
                        "$and": [
                          { "$eq": [ "$LABELID", "IdViews" ] },
                          { "$eq": [ "$VALUEID", "$cleanViewId" ] }
                        ]
                      }
                    }
                  },
                  {
                    "$project": {
                      "_id": 0,
                      "VIEWNAME": "$VALUE",
                      "APPLICATIONID": "$VALUEPAID"
                    }
                  }
                ],
                "as": "viewInfo"
              }
            },
            {
              "$unwind": {
                "path": "$viewInfo",
                "preserveNullAndEmptyArrays": true
              }
            },
            {
              "$addFields": {
                "VIEWNAME": "$viewInfo.VIEWNAME",
                "APPLICATIONID": "$viewInfo.APPLICATIONID"
              }
            },
            {
              "$lookup": {
                "from": "ZTEVALUES",
                "let": { "rawAppId": "$APPLICATIONID" },
                "pipeline": [
                  {
                    "$addFields": {
                      "cleanAppId": {
                        "$replaceOne": {
                          "input": "$$rawAppId",
                          "find": "IdApplications-",
                          "replacement": ""
                        }
                      }
                    }
                  },
                  {
                    "$match": {
                      "$expr": {
                        "$and": [
                          { "$eq": [ "$LABELID", "IdApplications" ] },
                          { "$eq": [ "$VALUEID", "$cleanAppId" ] }
                        ]
                      }
                    }
                  },
                  {
                    "$project": {
                      "_id": 0,
                      "APPLICATIONNAME": "$VALUE"
                    }
                  }
                ],
                "as": "appInfo"
              }
            },
            {
              "$unwind": {
                "path": "$appInfo",
                "preserveNullAndEmptyArrays": true
              }
            },
            {
              "$addFields": {
                "APPLICATIONNAME": "$appInfo.APPLICATIONNAME"
              }
            },
            { "$unwind": "$PRIVILEGES.PRIVILEGEID" },
            {
              "$lookup": {
                "from": "ZTEVALUES",
                "let": { "privilegeId": "$PRIVILEGES.PRIVILEGEID" },
                "pipeline": [
                  {
                    "$match": {
                      "$expr": {
                        "$and": [
                          { "$eq": [ "$LABELID", "IdPrivileges" ] },
                          { "$eq": [ "$VALUEID", "$$privilegeId" ] }
                        ]
                      }
                    }
                  },
                  {
                    "$project": {
                      "_id": 0,
                      "PRIVILEGENAME": "$VALUE"
                    }
                  }
                ],
                "as": "privInfo"
              }
            },
            { "$unwind": "$privInfo" },
            {
              "$addFields": {
                "PRIVILEGES.PRIVILEGENAME": "$privInfo.PRIVILEGENAME"
              }
            },
            // Agrupar los resultados de este lookup para dejar la estructura enriquecida del rol
            {
              "$group": {
                "_id": {
                  "ROLEID": "$ROLEID",
                  "ROLENAME": "$ROLENAME",
                  "DESCRIPTION": "$DESCRIPTION",
                  "PROCESSID": "$processInfo.VALUEID",
                  "PROCESSNAME": "$PROCESSNAME",
                  "VIEWID": "$viewInfo.VALUEID",
                  "VIEWNAME": "$VIEWNAME",
                  "APPLICATIONID": "$appInfo.VALUEID",
                  "APPLICATIONNAME": "$APPLICATIONNAME"
                },
                "PRIVILEGES": {
                  "$push": {
                    "PRIVILEGEID": "$PRIVILEGES.PRIVILEGEID",
                    "PRIVILEGENAME": "$PRIVILEGES.PRIVILEGENAME"
                  }
                }
              }
            },
            {
              "$project": {
                "_id": 0,
                "ROLEID": "$_id.ROLEID",
                "ROLENAME": "$_id.ROLENAME",
                "DESCRIPTION": "$_id.DESCRIPTION",
                "PROCESSES": {
                  "$arrayElemAt": [
                    [{
                      "PROCESSID": "$_id.PROCESSID",
                      "PROCESSNAME": "$_id.PROCESSNAME",
                      "VIEWID": "$_id.VIEWID",
                      "VIEWNAME": "$_id.VIEWNAME",
                      "APPLICATIONID": "$_id.APPLICATIONID",
                      "APPLICATIONNAME": "$_id.APPLICATIONNAME",
                      "PRIVILEGES": "$PRIVILEGES"
                    }], 0
                  ]
                }
              }
            }
          ],
          "as": "enrichedRole"
        }
      },
      // Volvemos a agrupar por usuario para reconstruir el arreglo de roles enriquecidos
      {
        "$group": {
          "_id": "$_id",
          "userData": { "$first": "$$ROOT" },
          "enrichedRoles": { "$push": "$enrichedRole" }
        }
      },
      {
        "$addFields": {
          // Dado que '$enrichedRoles' es un arreglo de arreglos (por cada unwind se crea un array con 1 elemento), 
          // lo aplanamos:
          "userData.ROLES": { "$reduce": {
            "input": "$enrichedRoles",
            "initialValue": [],
            "in": { "$concatArrays": [ "$$value", "$$this" ] }
          } }
        }
      },
      {
        "$replaceRoot": { "newRoot": "$userData" }
      }
    ];
    
    const result = await UsersSchema.aggregate(pipeline);
    if (!result || result.length === 0) {
      return { mensaje: 'No se encontró el usuario' };
    }
    return result[0];
  } catch (error) {
    console.log("Error en getOneUser:", error);
    return { error: true, message: error.message };
  }
}


async function PostUser(req) {
    try {
        const newUser = req.req.body;
        console.log("Usuario recibido: ",newUser);
        console.log("Entra al Metodo del servicio de post");
        if(!newUser){throw new Error('No envió los datos del usuario a agregar');}
        //Validar los roles//Validar los roles
        const rol = await validarRol(newUser.ROLES);
        console.log("CAMBIOS 1:",newUser);
        console.log("ROL: ",rol);
        newUser.ROLES = rol;
        console.log("CAMBIOS 2:",newUser);

        const createdUser = new UsersSchema(newUser);

        await createdUser.save();

        return createdUser.toObject();
    } catch (error) {
        console.log("Error en postUser:",error);
        return { error: true, message: error.message };
    }
}

async function UpdateUser(req,userid){
    try{
        const cambios = req.req.body;
        if(!cambios){throw new Error('No envió los datos del usuario a agregar');}
        //VALIDAR ROLES
        const rol = await validarRol(cambios.ROLES);
        console.log("CAMBIOS 1:",cambios);
        console.log("ROL: ",rol);
        cambios.ROLES = rol;
        console.log("CAMBIOS 2:",cambios);

        let user = await UsersSchema.findOneAndUpdate(
            {USERID:userid},
            {$set:cambios},
            {new:true}
        );

        if(!user){
            throw new Error('No se pudo actualizar al usuario');
        }

        return user.toObject();
    }catch(error){
        console.log("Error en updateUser:",error);
        return { error: true, message: error.message };
    }
}

async function LogDelete(userid){
    try {
        const user = await UsersSchema.findOneAndUpdate(
            {USERID:userid},
            {$set:{'DETAIL_ROW.ACTIVED': false,  'DETAIL_ROW.DELETED': true }},
            {new:true}
        );
        if(!user){
            throw new Error('No se pudo eliminar logicamente');
        }

        return user.toObject();
    } catch (error) {
        console.log("Error en logDelete:",error);
        return { error: true, message: error.message };
    }
}

async function HardDelete(userid) {
    try {
        const deleted = await UsersSchema.findOneAndDelete({USERID:userid});
        if(deleted.deletedCount === 0){
            throw new Error("No se pudo eliminar el usuario especificado");
        }

        return {mensaje:'Usuario eliminado con exito y para siempre'};
    } catch (error) {
        console.log("Error en hardDelete:",error);
        return { error: true, message: error.message };
    }
}

module.exports = {UsersCRUD};