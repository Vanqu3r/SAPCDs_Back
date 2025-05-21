const cds = require('@sap/cds');
const { RolesCRUD } = require('../services/sec-roles-service');
const { ValuesCRUD } = require('../services/sec-values-service');
const { CatalogsR } = require('../services/sec-catalogs-service');
<<<<<<< Updated upstream
const {GetAllLabels, PostLabel,DeleteLabel,PutLabel} = require('../services/sec-labels-service');

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

      //CRUD DE LABELS
       this.on('getall',async (req)=>{
            return GetAllLabels(req);
        });
=======
const { LabelCRUD} = require('../services/sec-labels-service');

class SecurityClass extends cds.ApplicationService {
  async init() {
    this.on('rolesCRUD', async (req) => {
      return RolesCRUD(req);
    });
    this.on('valuesCRUD', async (req) => {
      return ValuesCRUD(req);
    });
    this.on('catalogsR', async (req) => {
      return CatalogsR(req);
    });
    //CRUD DE LABELS
     this.on("labelCRUD", async (req) => {
      return LabelCRUD(req);
    });
    
>>>>>>> Stashed changes

        this.on('newLabel',async (req)=>{
            return PostLabel(req);
        }); 
        this.on('deleteLabel',async (req)=>{
            return DeleteLabel(req);
        }); 
        this.on('updateLabel',async (req)=>{
            return PutLabel(req);
        }); 

    };
};
module.exports = SecurityClass;