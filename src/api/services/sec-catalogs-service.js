const LabelSchema = require("../models/mongodb/ztlabels");
const ValueSchema = require("../models/mongodb/ztvalues");

async function CatalogsR(req) {
  try {
    const { procedure, type, labelid, valueid } = req.req.query;
    console.log(
      "PROCEDURE:", procedure,
      "TYPE:", type,
      "LABELID:", labelid,
      "VALUEID:", valueid
    );

    // GET ALL CATALOGS ----------------------------------
    if (procedure === "get" && type === "all") {
      const labels = await LabelSchema.find().lean();
      const values = await ValueSchema.find().lean();

      const valuesByLabel = values.reduce((acc, val) => {
        const key = val.LABELID;
        if (!acc[key]) acc[key] = [];
        acc[key].push(val);
        return acc;
      }, {});

      const result = labels.map((label) => ({
        ...label,
        VALUES: valuesByLabel[label.LABELID] || [],
      }));

      return result;
    }

    // GET CATALOG BY LABELID + VALUEID ------------------
    else if (procedure === "get" && type === "bylabelid" && labelid && valueid) {
      const label = await LabelSchema.findOne({ LABELID: labelid }).lean();

      if (!label) {
        return {
          success: false,
          message: `No se encontró ningún catálogo con LABELID: ${labelid}`,
          LABELID: labelid,
          VALUES: []
        };
      }

      const value = await ValueSchema.findOne({
        LABELID: labelid,
        VALUEID: valueid
      }).lean();

      if (!value) {
        return {
          success: false,
          message: `No se encontró VALUEID '${valueid}' dentro del LABELID '${labelid}'`,
          LABELID: labelid,
          VALUEID: valueid,
          VALUES: []
        };
      }

      return {
        ...label,
        VALUES: [value]
      };
    }

    // GET CATALOG BY LABELID ----------------------------
    else if (procedure === "get" && type === "bylabelid" && labelid) {
      const label = await LabelSchema.findOne({ LABELID: labelid }).lean();

      if (!label) {
        return {
          success: false,
          message: `No se encontró ningún catálogo con LABELID: ${labelid}`,
          LABELID: labelid,
          VALUES: [],
        };
      }

      const values = await ValueSchema.find({ LABELID: labelid }).lean();

      return {
        ...label,
        VALUES: values,
      };
    }

    // DEFAULT --------------------------------------------
    else {
      console.log("No coincide ningún procedimiento");
      throw new Error("Parámetros inválidos o incompletos");
    }

  } catch (error) {
    console.error("Error en CatalogsR:", error);
    return { error: true, message: error.message };
  }
}

module.exports = { CatalogsR };
