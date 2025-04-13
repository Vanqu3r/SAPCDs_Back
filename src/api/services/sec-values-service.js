const ValueSchema = require('../models/mongodb/ztvalues');

async function ValuesCRUD(req) {
  try {
    const { procedure, labelID, valueID} = req.req.query;
    console.log('PROCEDURE:', procedure,'LABELID:',labelID, 'VALUEPAID:', valueID);

    let result;

    if (procedure === 'post') {
        const newValue = req.req.body;
        const labelprocess = newValue.LABELID;
        if (labelprocess==="IdViews") {
            result = postValidation("IdApplications",newValue);
        }
        if (labelprocess==="IdProcesses"){
            result = postValidation("IdViews",newValue);
        }
        if(labelprocess==="IdApplications" || labelprocess==="IdPrivileges"){
            const validValue = await ValueSchema.create(newValue); 
            result = validValue.toObject();
        }
    }
    
    if (procedure === 'put') {    
      const updateValue = req.req.body;
      let ValueOriginal = await ValueSchema.findOne({
        VALUEID: updateValue.VALUEID,
        LABELID: updateValue.LABELID
      }).lean();

      if(ValueOriginal.VALUEPAID===updateValue.VALUEPAID){
        result = Update(updateValue);
      }else{
        if(ValueOriginal.LABELID==="IdViews"){
          result=putValidation("IdApplications",updateValue);
        }
        if(ValueOriginal.LABELID==="IdProcesses"){
          result=putValidation("IdViews",updateValue);
        }else{
          result = Update(updateValue);
        }
      }

    }

    if (procedure === 'delete' ) {
      
    }

    return result;
  } catch (error) {
    console.error('Error en ValuesCRUD:', error);
    return { error: true, message: error.message };
  }
}

async function postValidation(type,newValue) {
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

async function putValidation(type,Value) {
  const processIds = (Value.VALUEPAID.replace(type+"-", '').trim());
          let validacion = await ValueSchema.findOne({
              VALUEID: processIds,
              LABELID: type
            }).lean();
          if (validacion===null){
            throw new Error(`El siguiente IdApplications no existe: ${Value.VALUEPAID}`);
          }else{
            return result = Update(Value);
          }
}

async function Update(updateValue){
  const updateValidValue = await ValueSchema.findOneAndUpdate(
    {
      LABELID: updateValue.LABELID,
      VALUEID: updateValue.VALUEID
    },
    updateValue, // datos a actualizar
    { new: true } // que devuelva el documento actualizado
  );
    return result = updateValidValue.toObject(); 
}
module.exports = { ValuesCRUD };