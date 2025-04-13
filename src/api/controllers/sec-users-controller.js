const cds = require('@sap/cds');
//Importacion de los metodos del servicio
const {UsersCRUD} = require('../services/sec-users-service');

class UsersClass extends cds.ApplicationService{

    async init(){

        this.on('usersCRUD',async (req)=>{
            console.log(req);
            const reqType = req.query?.reqType;
            return UsersCRUD(req);
        });

        return await super.init();
    };

};

module.exports = UsersClass;