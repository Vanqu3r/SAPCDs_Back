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
        //const allUsers = await UsersSchema.find().lean();
        const allUsers = await usersComplete.find().lean();

        return allUsers;
    } catch (error) {
        return error;
    }
}

async function GetOneUser(userid) {
    try {
        //const userId = req.req.query?.userid;
        //const user = await UsersSchema.findOne({USERID:userid}).lean();
        const user = await usersComplete.findOne({USERID:userid}).lean();

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
        return error;
    }
}

async function UpdateUser(req,userid){
    try{
        const cambios = req.req.body;
        if(!cambios){throw new Error('No envió los datos del usuario a agregar');}
        //VALIDAR ROLES
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