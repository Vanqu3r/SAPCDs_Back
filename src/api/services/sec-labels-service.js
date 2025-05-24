// ===================================================
// IMPORTACIÓN DEL MODELO DE MONGOOSE
// ===================================================
const LabelSchema = require("../models/mongodb/ztlabels");

// ===================================================
// FUNCIÓN PRINCIPAL: CRUD PARA LABELS
// ===================================================
async function LabelsCRUD(req) {
  try {
    const { procedure, type, LabelId} = req.req.query;
    const currentUser = req.req?.query?.RegUser || 'SYSTEM';
    const body = req.data?.labels || req.data;
    let result;

    switch (procedure) {
      // =====================================
      // GET: Obtener todos o uno por LABELID
      // =====================================
      case 'get':
        if(LabelId){
            const label = await LabelSchema.findOne({LABELID: LabelId}).lean();
            if (!label){return {mensaje: "No se encontró ningún catalogo con este LABELID"}}
            result = label;
        }else {
          const labels = await LabelSchema.find().lean();
          if (!labels){return {mensaje: "Sin datos"}}          
          result = labels;
        }
        break;

      // ======================================
      // POST: Insertar uno o varios catálogos
      // ======================================
      case 'post':
        if (!body) throw new Error("No se reciben datos");
        const newlabel = body;
        if (Array.isArray(newlabel)) {
          // Si es un arreglo, mapear y agregar el _reguser a cada objeto
          const inserted = [];
          for (const doc of newlabel) {
            const instance = new LabelSchema(doc);
            instance._reguser = currentUser;
            const saved = await instance.save();
            inserted.push(saved.toObject());
          }
          result = inserted;
        } else {
          const instance = new LabelSchema(newlabel);
          instance._reguser = currentUser; // <<--- AQUÍ

          const validlabel = await instance.save();
          result = validlabel.toObject();
        }
        break;

      // ======================================
      // PUT: Actualizar un catálogo existente
      // ======================================
      case 'put':
        const cambios = body;

        if (!cambios || typeof cambios !== 'object') {
          throw new Error('No se enviaron datos para actualizar');
        }

        if (!LabelId) {
          throw new Error('Se requieren LABELID para actualizar');
        }

        const label = await LabelSchema.findOne({ LABELID: LabelId});
        if (!label) {
          throw new Error(`No se encontró el catalogo con LABELID ${LabelId}`);
        }

        if (!label.DETAIL_ROW) {
          label.DETAIL_ROW = { ACTIVED: true, DELETED: false, DETAIL_ROW_REG: [] };
        }

        if (Array.isArray(label.DETAIL_ROW.DETAIL_ROW_REG)) {
          label.DETAIL_ROW.DETAIL_ROW_REG.forEach(reg => {
            if (reg.CURRENT) reg.CURRENT = false;
          });
        } else {
          label.DETAIL_ROW.DETAIL_ROW_REG = [];
        }

        const now = new Date();
        label.DETAIL_ROW.DETAIL_ROW_REG.push({
          CURRENT: true,
          REGDATE: now,
          REGTIME: now,
          REGUSER: currentUser
        });

        Object.assign(label, cambios);
        const updated = await label.save();
        result = updated.toObject();
        break;

      // =====================================
      // DELETE: Eliminación lógica o física
      // =====================================
      case 'delete':
        switch (type){
          // LOGICO
          case 'logic':
            if (!LabelId) throw new Error("Falta labelID");
            const label = await LabelSchema.findOne({ LABELID: LabelId});

            if (!label) {
              throw new Error(`No se encontró el catalogo con LABELID ${LabelId}`);
            }

            label.DETAIL_ROW.ACTIVED = false;
            label.DETAIL_ROW.DELETED = true;

            // Desactivar registro actual
            if (Array.isArray(label.DETAIL_ROW.DETAIL_ROW_REG)) {
              label.DETAIL_ROW.DETAIL_ROW_REG.forEach(reg => {
                if (reg.CURRENT) reg.CURRENT = false;
              });
            } else {
              label.DETAIL_ROW.DETAIL_ROW_REG = [];
            }

            // Agregar nuevo registro de auditoría
            const now = new Date();
            label.DETAIL_ROW.DETAIL_ROW_REG.push({
              CURRENT: true,
              REGDATE: now,
              REGTIME: now,
              REGUSER: currentUser
            });

            // Guardar documento actualizado
            const updated = await label.save();
            result = updated.toObject();
            break;

          // FISICO
          case 'hard':
            const hardDeleted = await LabelSchema.deleteOne({ LABELID: LabelId });
            if (hardDeleted.deletedCount === 0) {
              throw new Error('No existe el catalogo especificado.');
            }
            result = { message: 'Catalogo eliminado.' };
            break;

          default:
            throw new Error('Tipo inválido en DELETE');
        }
      break;

      // ===========================================================
      // DEFAULT: Manejo de errores por procedimiento no reconocido
      // ===========================================================
      default:
        throw new Error("Parámetros inválidos o incompletos");
    }

    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    console.error("Error en LabelsCRUD:", error);
    return { error: true, message: error.message };
  }
}

module.exports = { LabelsCRUD };
