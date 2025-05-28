const { log } = require("@sap/cds");
const ValueSchema = require("../models/mongodb/ztvalues");

async function ValuesCRUD(req) {
  try {
    const { procedure, labelID, ValueID } = req.req.query;
    console.log(
      "PROCEDURE:",
      procedure,
      "LABELID:",
      labelID,
      "VALUEID:",
      ValueID
    );

    let result;

    if (procedure === "getall") {
      result = await ValueSchema.find().lean();
    }

    if (procedure === "post") {
      console.log("POST procedure");
      const newValue = req.req.query;
      const labelprocess = newValue.LABELID;
      const validValue = await ValueSchema.create(newValue);
      result = validValue.toObject();
    }

    if (procedure === "put") {
      const updateValue = req.req.query;
      let ValueOriginal = await ValueSchema.findOne({
        VALUEID: updateValue.VALUEID,
        LABELID: updateValue.LABELID,
      }).lean();

      if (ValueOriginal !== null) {
        result = Update(updateValue);
      } else {
        throw new Error(`No se actualizo el valor`);
      }
    }

    if (
      (procedure === "delete" || procedure === "actived") &&
      labelID !== null &&
      ValueID !== null
    ) {
      result = deleteAndActivedLogic(procedure, labelID, ValueID);
    }

    if (
      procedure === "deletePermanent" &&
      labelID !== null &&
      ValueID !== null
    ) {
      const deletePermanent = await ValueSchema.findOneAndDelete({
        LABELID: labelID,
        VALUEID: ValueID,
      });
      result = deletePermanent.toObject();
    }

    if (procedure === "deleteAll" && labelID !== null) {
      const deleteAll = await ValueSchema.deleteMany({ LABELID: labelID });
      console.log("deleteAll:", deleteAll);
      result = {
        message: "All values deleted successfully",
        count: deleteAll.deletedCount,
      };
    }

    if (procedure === "get" && labelID !== null) {
      result = await ValueSchema.find({ LABELID: labelID }).lean();
    }

    return result;
  } catch (error) {
    console.error("Error en ValuesCRUD:", error);
    return { error: true, message: error.message };
  }
}

async function Update(updateValue) {
  const updateValidValue = await ValueSchema.findOneAndUpdate(
    {
      LABELID: updateValue.LABELID,
      VALUEID: updateValue.VALUEID,
    },
    updateValue, // datos a actualizar
    { new: true } // que devuelva el documento actualizado
  );
  return (result = updateValidValue.toObject());
}

async function deleteAndActivedLogic(procedure, labelID, ValueID) {
  let actived = true;
  let deleted = false;
  if (procedure === "delete") {
    actived = false;
    deleted = true;
  }
  const deleteLogic = await ValueSchema.findOneAndUpdate(
    {
      LABELID: labelID,
      VALUEID: ValueID,
    },
    {
      "DETAIL_ROW.ACTIVED": actived,
      "DETAIL_ROW.DELETED": deleted,
    },
    { new: true }
  );
  return (result = deleteLogic.toObject());
}

module.exports = { ValuesCRUD };
