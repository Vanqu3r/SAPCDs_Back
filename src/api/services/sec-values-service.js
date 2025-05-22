// ===================================================
// IMPORTACIÓN DEL MODELO DE MONGOOSE
// ===================================================
const ValueSchema = require('../models/mongodb/ztvalues');

// ===================================================
// FUNCIÓN PRINCIPAL: CRUD PARA VALUES
// ===================================================
async function ValuesCRUD(req) {
  try {
    const { procedure, LabelId, ValueId } = req.req.query;
    const currentUser = req.req?.query?.RegUser || 'SYSTEM';
    const body = req.req.body;
    let result;

    console.log('PROCEDURE:', procedure, 'LABELID:', LabelId, 'VALUEID:', ValueId);

    switch (procedure) {
      
      // ===============================================
      // POST: Insertar uno o varios valores
      // ===============================================
      case 'post': {
        console.log('POST procedure');
        const newValue = body;

        if (Array.isArray(newValue)) {
          // Si es un arreglo, mapear y agregar el _reguser a cada objeto
          const inserted = [];
          for (const doc of newValue) {
            const instance = new ValueSchema(doc);
            instance._reguser = currentUser;
            const saved = await instance.save();
            inserted.push(saved.toObject());
          }
          result = inserted;
        } else {
          const instance = new ValueSchema(newValue);
          instance._reguser = currentUser; // <<--- AQUÍ

          const validValue = await instance.save();
          result = validValue.toObject();
        }
        break;
      }

      // ===============================================
      // ACTUALIZAR VALUE (PUT)
      // ===============================================
      case 'put': {
        console.log('PUT procedure');
        const cambios = body;

        if (!cambios || typeof cambios !== 'object') {
          throw new Error('No se enviaron datos para actualizar');
        }

        if (!LabelId || !ValueId) {
          throw new Error('Se requieren LABELID y VALUEID para actualizar');
        }

        const value = await ValueSchema.findOne({ LABELID: LabelId, VALUEID: ValueId });
        if (!value) {
          throw new Error(`No se encontró el valor con LABELID ${LabelId} y VALUEID ${ValueId}`);
        }

        if (!value.DETAIL_ROW) {
          value.DETAIL_ROW = { ACTIVED: true, DELETED: false, DETAIL_ROW_REG: [] };
        }

        if (Array.isArray(value.DETAIL_ROW.DETAIL_ROW_REG)) {
          value.DETAIL_ROW.DETAIL_ROW_REG.forEach(reg => {
            if (reg.CURRENT) reg.CURRENT = false;
          });
        } else {
          value.DETAIL_ROW.DETAIL_ROW_REG = [];
        }

        const now = new Date();
        value.DETAIL_ROW.DETAIL_ROW_REG.push({
          CURRENT: true,
          REGDATE: now,
          REGTIME: now,
          REGUSER: currentUser
        });

        Object.assign(value, cambios);
        const updated = await value.save();
        result = updated.toObject();
        break;
      }
      
      // ===============================================
      // ACTIVAR / DESACTIVAR VALUE (LÓGICO)
      // ===============================================
      case 'desactived':
      case 'actived': {
        if (!LabelId || !ValueId) {
          throw new Error('Se requieren LABELID y VALUEID para activar o desactivar');
        }
        result = await deleteAndActivedLogic(procedure, LabelId, ValueId, currentUser);
        break;
      }

      // ===============================================
      // ELIMINAR VALUE FÍSICAMENTE (DELETE)
      // ===============================================
      case 'delete': {
        if (!LabelId || !ValueId) {
          throw new Error('Se requieren LABELID y VALUEID para eliminar');
        }

        const value = await ValueSchema.findOne({LABELID: LabelId, VALUEID: ValueId});

        if (!value) throw new Error("El valor no existe");

        const deleted = await ValueSchema.findOneAndDelete({ LABELID: LabelId, VALUEID: ValueId });

        if(deleted.deletedCount === 0){
            throw new Error("No se pudo eliminar el valor especificado");
        }

        result = {mensaje:'Valor eliminado con exito y para siempre'};

        break;
      }

      // ===============================================
      // OBTENER VALUE(S) (GET)
      // ===============================================
      case 'get': {
        if (LabelId) {
          if (ValueId) {
            result = await ValueSchema.findOne({ LABELID: LabelId, VALUEID: ValueId }).lean();
            if(!result) {return {mensaje: "No se encontró el valor especificado"}}
          } else {
            result = await ValueSchema.find({ LABELID: LabelId }).lean();
          }
        } else {
          result = await ValueSchema.find().lean();
        }
        break;
      }

      // ===============================================
      // PROCEDIMIENTO NO SOPORTADO
      // ===============================================
      default:
        throw new Error(`Procedimiento '${procedure}' no soportado`);
    }

    return result;

  } catch (error) {
    console.error('Error en ValuesCRUD:', error);
    return { error: true, message: error.message };
  }
}

// async function postValidation(type,newValue) {
//     const processIds = (newValue.VALUEPAID.replace(type+"-", '').trim());
//             let validacion = await ValueSchema.findOne({
//                 VALUEID: processIds,
//                 LABELID: type
//               }).lean();
//             if (validacion===null){
//                 throw new Error(`El siguiente ${type}  no existe: ${processIds}En ValuePaid, coloque la siguiente estructura en el label: ${type}-ID`);
//             }else{
//                 const validValue = await ValueSchema.create(newValue); 
//                 result = validValue.toObject();
//             }
//             return result;
// }

// async function putValidation(type,Value) {
//   const processIds = (Value.VALUEPAID.replace(type+"-", '').trim());
//           let validacion = await ValueSchema.findOne({
//               VALUEID: processIds,
//               LABELID: type
//             }).lean();
//           if (validacion===null){
//             throw new Error(`El siguiente valor de ${type} no existe: ${processIds}En ValuePaid, coloque la siguiente estructura en el label: ${type}-ID`);
//           }else{
//             return result = Update(Value);
//           }
// }


// ===================================================
// FUNCIÓN AUXILIAR PARA DESACTIVAR/ACTIVAR LOGICAMENTE UN VALUE
// ===================================================
async function deleteAndActivedLogic(procedure, LabelId, ValueId, currentUser) {
  try {
    const value = await ValueSchema.findOne({ LABELID: LabelId, VALUEID: ValueId });

    if (!value) {
      throw new Error(`No se encontró el valor con LABELID ${LabelId} y VALUEID ${ValueId}`);
    }

    // Definir los valores según el procedimiento
    let actived = true;
    let deleted = false;
    if (procedure === 'desactived') {
      actived = false;
      deleted = true;
    }

    // Actualizar valores principales
    value.DETAIL_ROW = value.DETAIL_ROW || {
      ACTIVED: true,
      DELETED: false,
      DETAIL_ROW_REG: []
    };

    value.DETAIL_ROW.ACTIVED = actived;
    value.DETAIL_ROW.DELETED = deleted;

    // Desactivar registro actual
    if (Array.isArray(value.DETAIL_ROW.DETAIL_ROW_REG)) {
      value.DETAIL_ROW.DETAIL_ROW_REG.forEach(reg => {
        if (reg.CURRENT) reg.CURRENT = false;
      });
    } else {
      value.DETAIL_ROW.DETAIL_ROW_REG = [];
    }

    // Agregar nuevo registro de auditoría
    const now = new Date();
    value.DETAIL_ROW.DETAIL_ROW_REG.push({
      CURRENT: true,
      REGDATE: now,
      REGTIME: now,
      REGUSER: currentUser
    });

    // Guardar documento actualizado
    const updated = await value.save();
    return updated.toObject();

  } catch (error) {
    console.error('Error en deleteAndActivedLogic:', error);
    return { error: true, message: error.message };
  }
}


module.exports = { ValuesCRUD };