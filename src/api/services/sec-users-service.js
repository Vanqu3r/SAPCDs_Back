// ==============================
// IMPORTACIÓN DE MODELOS
// ==============================
const UsersSchema = require('../models/mongodb/ztusers');
const RoleSchema = require('../models/mongodb/ztroles');
const usersComplete = require('../models/mongodb/usersComplete'); // (No usado, puedes eliminarlo si no lo necesitas)

// ==============================
// FUNCIÓN AUXILIAR: validarRol
// Valida que los roles proporcionados existan en la colección ZTROLES
// ==============================
const validarRol = async (roles) => {
    try {
        console.log("Entra a la funcion de validacion");
        if (roles.length === 0) return;

        let rolesId = roles.map(r => r.ROLEID);
        let validation = await RoleSchema.find({ ROLEID: { $in: rolesId } }).lean();

        if (validation.length !== roles.length) {
            console.log('Alguno de los roles ingresados no existe');
            return validation.toObject(); // <- cuidado, .toObject() sobre array da error
        } else {
            console.log("todos los roles existen");
            return roles;
        }
    } catch (error) {
        throw error;
    }
}

// ==============================
// FUNCIÓN PRINCIPAL: UsersCRUD
// Enrutador de operaciones CRUD para usuarios según el procedimiento y tipo solicitados
// ==============================
async function UsersCRUD(req) {
    try {
        const { procedure, type, userid } = req.req.query;
        console.log('REQUEST: ', procedure, 'TYPE:', type);
        let res;

        switch (procedure) {
            case 'get':
                if (type === 'all') {
                    res = GetAllUsers();
                } else if (type === 'one') {
                    res = GetOneUser(userid);
                } else {
                    throw new Error("Coloca un tipo de búsqueda válido (all o one)");
                }
                break;

            case 'post':
                res = PostUser(req);
                break;

            case 'put':
                res = UpdateUser(req, userid);
                break;

            case 'delete':
                if (type === 'logic') {
                    res = LogDelete(userid, req);
                } else if (type === 'hard') {
                    res = HardDelete(userid);
                }
                break;

            default:
                throw new Error('Parámetros inválidos o incompletos');
        }

        return res;
    } catch (error) {
        console.error('Error en UsersCRUD:', error);
        return { error: true, message: error.message };
    }
}

// ==============================
// GET ALL USERS
// Retorna todos los usuarios con sus roles enriquecidos (sin DETAIL_ROW)
// ==============================
async function GetAllUsers() {
    try {
        const allUsers = await UsersSchema.find().lean();

        const enrichedUsers = await Promise.all(allUsers.map(async user => {
            const userRoles = user.ROLES || [];

            const fullRoles = await Promise.all(userRoles.map(async roleRef => {
                const role = await RoleSchema
                    .findOne({ ROLEID: roleRef.ROLEID })
                    .select("-DETAIL_ROW")
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

// ==============================
// GET ONE USER
// Retorna un usuario por su USERID con sus roles enriquecidos
// ==============================
async function GetOneUser(userid) {
    try {
        const user = await UsersSchema.findOne({ USERID: userid }).lean();
        if (!user) return { mensaje: 'No se encontró el usuario' };

        const userRoles = user.ROLES || [];

        const fullRoles = await Promise.all(userRoles.map(async roleRef => {
            const role = await RoleSchema
                .findOne({ ROLEID: roleRef.ROLEID })
                .select("-DETAIL_ROW")
                .lean();

            return role ? { ...roleRef, ...role } : {
                ROLEID: roleRef.ROLEID,
                error: "Rol no encontrado"
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

// ==============================
// POST USER
// Agrega un nuevo usuario validando los roles, guarda usuario y auditoría
// ==============================
async function PostUser(req) {
    try {
        const currentUser = req.req?.query?.RegUser;
        const newUser = req.req.body;

        if (!newUser) throw new Error('No envió los datos del usuario a agregar');

        const rol = await validarRol(newUser.ROLES);
        newUser.ROLES = rol;

        const instance = new UsersSchema(newUser);
        instance._reguser = currentUser;

        const validUser = await instance.save();
        return validUser.toObject();
    } catch (error) {
        return error;
    }
}

// ==============================
// PUT USER
// Actualiza un usuario existente, actualiza auditoría y roles
// ==============================
async function UpdateUser(req, userid) {
    try {
        const currentUser = req.req?.query?.RegUser || 'SYSTEM';
        const cambios = req.req.body;

        const user = await UsersSchema.findOne({ USERID: userid });
        if (!user) throw new Error('No se encontró ningún usuario');
        if (!cambios || Object.keys(cambios).length === 0)
            throw new Error('No se enviaron datos para actualizar');

        // Validar roles si están en el request
        if (cambios.ROLES) {
            const rol = await validarRol(cambios.ROLES);
            cambios.ROLES = rol;
        }

        // Manejo de auditoría
        if (!user.DETAIL_ROW) {
            user.DETAIL_ROW = { ACTIVED: true, DELETED: false, DETAIL_ROW_REG: [] };
        }

        const now = new Date();

        if (!Array.isArray(user.DETAIL_ROW.DETAIL_ROW_REG)) {
            user.DETAIL_ROW.DETAIL_ROW_REG = [];
        } else {
            user.DETAIL_ROW.DETAIL_ROW_REG.forEach(reg => {
                if (reg.CURRENT) reg.CURRENT = false;
            });
        }

        user.DETAIL_ROW.DETAIL_ROW_REG.push({
            CURRENT: true,
            REGDATE: now,
            REGTIME: now,
            REGUSER: currentUser
        });

        // Aplicar cambios
        Object.keys(cambios).forEach(key => {
            user[key] = cambios[key];
        });

        const updated = await user.save();
        return updated.toObject();
    } catch (error) {
        return { error: true, message: error.message };
    }
}

// ==============================
// LOGICAL DELETE
// Realiza una eliminación lógica (ACTIVED = false, DELETED = true)
// ==============================
async function LogDelete(userid, req) {
    try {
        const currentUser = req.req?.query?.RegUser || 'SYSTEM';
        const user = await UsersSchema.findOne({ USERID: userid });

        if (!user) throw new Error('No se encontró ningún usuario');

        if (!user.DETAIL_ROW) {
            user.DETAIL_ROW = { ACTIVED: true, DELETED: false, DETAIL_ROW_REG: [] };
        }

        const now = new Date();

        if (!Array.isArray(user.DETAIL_ROW.DETAIL_ROW_REG)) {
            user.DETAIL_ROW.DETAIL_ROW_REG = [];
        } else {
            user.DETAIL_ROW.DETAIL_ROW_REG.forEach(reg => {
                if (reg.CURRENT) reg.CURRENT = false;
            });
        }

        user.DETAIL_ROW.ACTIVED = false;
        user.DETAIL_ROW.DELETED = true;

        user.DETAIL_ROW.DETAIL_ROW_REG.push({
            CURRENT: true,
            REGDATE: now,
            REGTIME: now,
            REGUSER: currentUser
        });

        const updated = await user.save();
        return updated.toObject();
    } catch (error) {
        console.error('Error en LogDelete:', error);
        throw error;
    }
}

// ==============================
// HARD DELETE
// Elimina físicamente al usuario de la base de datos
// ==============================
async function HardDelete(userid) {
    try {
        const deleted = await UsersSchema.findOneAndDelete({ USERID: userid });
        if (!deleted) {
            throw new Error("No se pudo eliminar el usuario especificado");
        }

        return { mensaje: 'Usuario eliminado con éxito y para siempre' };
    } catch (error) {
        return error;
    }
}

// Exportar función principal del servicio
module.exports = { UsersCRUD };
