const cds = require('@sap/cds');
const { RolesCRUD } = require('../services/sec-roles-service');

class SecurityClass extends cds.ApplicationService {
    async init(){
      this.on('rolesCRUD', async (req) => {
        return RolesCRUD(req);
      });
      
    };
};
module.exports = SecurityClass;