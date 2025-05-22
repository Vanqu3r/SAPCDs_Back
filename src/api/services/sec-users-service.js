const UsersSchema = require('../models/mongodb/ztusers');
const RoleSchema = require('../models/mongodb/ztroles');
const usersComplete = require('../models/mongodb/usersComplete');

const validarRol = async (roles) => {
    try {
        console.log("Entra a la funcion de validacion");
        if(roles.length === 0){
            return;
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
            case 'get':
                if(type === 'all'){
                    res = GetAllUsers();
                }else if(type === 'one'){
                    res = GetOneUser(userid);
                }else{
                    throw new Error("Coloca un tipo de búsqueda válido (all o one)");
                }
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
                    res = LogDelete(userid, req);
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
        const allUsers = await UsersSchema.find().lean();

        const enrichedUsers = await Promise.all(allUsers.map(async user => {
            const userRoles = user.ROLES || [];

            const fullRoles = await Promise.all(userRoles.map(async roleRef => {
                const role = await RoleSchema
                .findOne({ ROLEID: roleRef.ROLEID })
                .select("-DETAIL_ROW") // Excluir DETAIL_ROW
                .lean();

                return role || {
                ROLEID: roleRef.ROLEID,
                error: "Rol no encontrado"
                };
            }));

            return {
                ...user,
                ROLES: fullRoles
            };
        }));

            return enrichedUsers;
    } catch (error) {
        return error;
    }
}

async function GetOneUser(userid) {
    try {
        const user = await UsersSchema.findOne({ USERID: userid }).lean();

        if (!user) {
            return { mensaje: 'No se encontró el usuario' };
        }

        const userRoles = user.ROLES || [];

        const fullRoles = await Promise.all(userRoles.map(async roleRef => {
            const role = await RoleSchema
                .findOne({ ROLEID: roleRef.ROLEID })
                .select("-DETAIL_ROW") // Excluir DETAIL_ROW
                .lean();

            if (!role) {
                return {
                    ROLEID: roleRef.ROLEID,
                    error: "Rol no encontrado"
                };
            }

            return {
                ...roleRef,
                ...role,
            };
        }));

        return {
            ...user,
            ROLES: fullRoles
        };

    } catch (error) {
        return { error: error.message };
    }
}


async function PostUser(req) {
    try {
        const currentUser = req.req?.query?.RegUser;
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

        const instance = new UsersSchema(newUser);
        instance._reguser = currentUser;

        const validUser = await instance.save();

        await validUser.save();

        return validUser.toObject();
    } catch (error) {
        return error;
    }

}

async function UpdateUser(req,userid){
    try{
        const currentUser = req.req?.query?.RegUser || 'SYSTEM';
        const cambios = req.req.body;
        
        // Buscar usuario actual
        const user = await UsersSchema.findOne({ USERID: userid });

        // Validar si existe el usuario
        if(!user){throw new Error('No se encontró ningún usuario');}

        // Validar que existan elementos en el body
        if(!cambios){throw new Error('No envió los datos del usuario a agregar');}

        // Validar roles
        const rol = await validarRol(cambios.ROLES);
        console.log("CAMBIOS 1:",cambios);
        console.log("ROL: ",rol);
        cambios.ROLES = rol;
        console.log("CAMBIOS 2:",cambios);

        if (!user) {
            throw new Error('Usuario no encontrado');
        }

        // Desactivar el registro CURRENT actual en DETAIL_ROW_REG
        if (!user.DETAIL_ROW) {
            user.DETAIL_ROW = { ACTIVED: true, DELETED: false, DETAIL_ROW_REG: [] };
        }

        const now = new Date();

        if (Array.isArray(user.DETAIL_ROW.DETAIL_ROW_REG)) {
            user.DETAIL_ROW.DETAIL_ROW_REG.forEach(reg => {
                if (reg.CURRENT) reg.CURRENT = false;
            });
        } else {
            user.DETAIL_ROW.DETAIL_ROW_REG = [];
        }

        // Agregar nuevo registro en DETAIL_ROW_REG
        user.DETAIL_ROW.DETAIL_ROW_REG.push({
            CURRENT: true,
            REGDATE: now,
            REGTIME: now,
            REGUSER: currentUser
        });

        // Aplicar cambios recibidos
        Object.assign(user, cambios);

        const updated = await user.save();
        return updated.toObject();

    }catch(error){
        return error;
    }
}

async function LogDelete(userid, req) {
  try {
    const currentUser = req.req?.query?.RegUser || 'SYSTEM';

    // Buscar usuario actual
    const user = await UsersSchema.findOne({ USERID: userid });

    if (!user) throw new Error('No se encontró ningún usuario');

    if (!user.DETAIL_ROW) {
      user.DETAIL_ROW = { ACTIVED: true, DELETED: false, DETAIL_ROW_REG: [] };
    }

    const now = new Date();

    if (Array.isArray(user.DETAIL_ROW.DETAIL_ROW_REG)) {
      user.DETAIL_ROW.DETAIL_ROW_REG.forEach(reg => {
        if (reg.CURRENT) reg.CURRENT = false;
      });
    } else {
      user.DETAIL_ROW.DETAIL_ROW_REG = [];
    }

    // Marcar borrado lógico
    user.DETAIL_ROW.ACTIVED = false;
    user.DETAIL_ROW.DELETED = true;

    // Nuevo registro de detalle
    user.DETAIL_ROW.DETAIL_ROW_REG.push({
      CURRENT: true,
      REGDATE: now,
      REGTIME: now,
      REGUSER: currentUser
    });

    // Guardar cambios
    const updated = await user.save();

    return updated.toObject();
  } catch (error) {
    console.error('Error en LogDelete:', error);
    throw error;  // Mejor lanzar el error para que el controlador lo capture
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
        return error;
    }
}

module.exports = {UsersCRUD};