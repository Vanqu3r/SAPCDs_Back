const ValueSchema = require('../models/mongodb/ztvalues');

async function ValuesCRUD(req) {
  try {
    const { procedure, labelID, valuePAID} = req.req.query;
    console.log('PROCEDURE:', procedure,'LABELID:',labelID, 'VALUEPAID:', valuePAID);

    let result;

    if (procedure === 'post') {
        const newValue = req.req.body;
        const labelprocess = newValue.LABELID;
        if (labelprocess==="IdViews") {
            result = postValidación("IdApplications",newValue);
        }
        if (labelprocess==="IdProcesses"){
            result = postValidación("IdViews",newValue);
        }
        if(labelprocess==="IdApplications" && labelprocess==="IdPrivileges"){
            const validValue = await ValueSchema.create(newValue); 
            result = validValue.toObject();
        }
    }
    
    if (procedure === 'put') {
      
    }

    if (procedure === 'delete' ) {
      
    }

    return result;
  } catch (error) {
    console.error('Error en ValuesCRUD:', error);
    return { error: true, message: error.message };
  }
}

async function postValidación(type,newValue) {
    const processIds = (newValue.VALUEPAID.replace(type+"-", '').trim());
            let validacion = await ValueSchema.findOne({
                VALUEID: processIds,
                LABELID: type
              }).lean();
            if (validacion===null){
                throw new Error(`El siguiente ${type}  no existe: ${processIds}`);
            }else{
                const validValue = await ValueSchema.create(newValue); 
                result = validValue.toObject();
            }
            return result;
}

module.exports = { ValuesCRUD };