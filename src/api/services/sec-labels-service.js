const ztlabels = require("../models/mongodb/ztlabels");

async function LabelCRUD(req) {
  try {
    const { procedure, type, labelId } = req.req.query;
    console.log("REQUEST: ", procedure, "TYPE:", type);

    let res;

    switch (procedure) {
      case "getall":
        console.log("hola");

        res = GetAllLabels();
        break;
      case "getone":
        res = GetOneLabel(labelId);
        break;
      case "post":
        res = PostLabel(req);
        break;
      case "patch":
        res = PatchLabel(req);
        break;
      case "delete":
        if (type === "logic") {
          res = LogicalLabel(req);
        } else if (type === "hard") {
          res = DeletePLabel(req);
        }
        break;
      default:
        console.log("No coincide ningún procedimiento");
        throw new Error("Parámetros inválidos o incompletos");
    }

    return res;
  } catch (error) {
    console.error("Error en RolesCRUD:", error);
    return { error: true, message: error.message };
  }
}

async function GetAllLabels(req) {
  try {
    let labels;
    labels = await ztlabels.find().lean();
    return labels;
  } catch (error) {
    return error;
  } finally {
  }
}
async function GetOneLabel(labelId) {
  try {
    let labels;
    labels = await ztlabels.find({ LABELID: labelId }).lean();
    return labels;
  } catch (error) {
    return error;
  } finally {
  }
}

async function PostLabel(req) {
  //NUEVO
  try {
    const newlabel = req.data.values; // recupeaar los datos de la nueva label en el parametro req
    if (!newlabel) {
      // si no se reciben datos, retornar un error
      return new Error("No se reciben datos");
    }

    const result = await ztlabels.insertOne(newlabel); // insertar la nueva label en la base de datos
    return JSON.parse(JSON.stringify(result)); // retornar el resultado de la insercion, en formato JSON
  } catch (error) {
    return error;
  }
}

async function DeletePLabel(req) {
  try {
    const id = req.data._id; // recupear el id de la label a eliminar del parametro req

    const result = await ztlabels.deleteOne({ _id: id }); // eliminar la label en la base de datos
    return JSON.parse(JSON.stringify(result)); // retornar el resultado de la eliminacion, en formato JSON
  } catch (error) {
    return error;
  }
}

async function PatchLabel(req) {
  //UPDATE
  try {
    const label = req.data.values; // recupeaar los datos nuevos de la label en el parametro req
    const id = label?._id; // identificamos el id ya existente de la label a actualizar

    if (!label || !id) {
      // si no se reciben datos, retornar un error
      return new Error("No se reciben datos");
    }
    // Eliminar _id para evitar actualizarlo (es inmutable en MongoDB)
    const { _id, ...updatedFields } = label;

    const result = await ztlabels.updateOne(
      { _id: id }, // Filtro por ID
      { $set: updatedFields } // Solo campos enviados
    ); // actualizar la label en la base de datos

    // Verificar si se actualizó correctamente
    if (result.matchedCount === 0) {
      throw new Error("Etiqueta no encontrada");
    }

    return {
      message: "Etiqueta actualizada correctamente",
      result: result.modifiedCount > 0, // true si se actualizo, false si no se actualizo
    }; // retornar el resultado de la actualizacion, en formato JSON
  } catch (error) {
    return error;
  }
}

async function LogicalLabel(req) {
  const { status, labelID } = req.req.query;
  console.log("si entramos ");

  let actived = true;
  let deleted = false;
  if (status && status === "delete") {
    actived = false;
    deleted = true;
  }
  const deleteLogic = await ztlabels.findOneAndUpdate(
    {
      LABELID: labelID,
    },
    {
      "DETAIL_ROW.ACTIVED": actived,
      "DETAIL_ROW.DELETED": deleted,
    },
    { new: true }
  );
  console.log(deleteLogic);

  return deleteLogic;
}

module.exports = {
  LabelCRUD,
};
