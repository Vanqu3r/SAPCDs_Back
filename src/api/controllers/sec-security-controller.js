const cds = require('@sap/cds');
const { RolesCRUD } = require('../services/sec-roles-service');
const { ValuesCRUD } = require('../services/sec-values-service');

class SecurityClass extends cds.ApplicationService {
    async init(){
      this.on('rolesCRUD', async (req) => {
        return RolesCRUD(req);
      });
      this.on('valuesCRUD', async (req) => {
        return ValuesCRUD(req);
      });
      
    };
};
module.exports = SecurityClass;