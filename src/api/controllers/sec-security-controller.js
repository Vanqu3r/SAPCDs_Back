const cds = require('@sap/cds');
const { RolesCRUD } = require('../services/sec-roles-service');
const { ValuesCRUD } = require('../services/sec-values-service');
const { CatalogsR } = require('../services/sec-catalogs-service');

class SecurityClass extends cds.ApplicationService {
    async init(){
      this.on('rolesCRUD', async (req) => {
        return RolesCRUD(req);
      });
      this.on('valuesCRUD', async (req) => {
        return ValuesCRUD(req);
      });
      this.on('catalogsR', async (req) => {
        return CatalogsR(req);
      });
      
    };
};
module.exports = SecurityClass;