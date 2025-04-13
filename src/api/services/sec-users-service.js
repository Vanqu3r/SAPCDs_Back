const UsersSchema = require('../models/mongodb/ztusers');


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
        const allUsers = await UsersSchema.find().lean();

        return allUsers;
    } catch (error) {
        return error;
    }
}

async function GetOneUser(userid) {
    try {
        //const userId = req.req.query?.userid;
        const user = await UsersSchema.findOne({USERID:userid}).lean();

        if(!user){
            return {mensaje:'No se encontró el usuario'};
        }

        return user;
    } catch (error) {
        return error;
    }
}


async function PostUser(req) {
    try {
        const newUser = req.req.body;
        if(!newUser){throw new Error('No envió los datos del usuario a agregar');}
        //Validar los roles

        const createdUser = await UsersSchema.create(newUser);

        return createdUser.toObject();
    } catch (error) {
        return error;
    }
}

async function UpdateUser(req,userid){
    try{
        const cambios = req.req.body;
        //VALIDAR ROLES

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
        return error;
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
        return error;
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