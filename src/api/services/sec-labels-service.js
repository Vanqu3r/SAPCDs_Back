const ztlabels = require('../models/mongodb/ztlabels');

async function GetAllLabels(req) {
    try{
        let labels;
        labels = await ztlabels.find().lean();
        return (labels)
    } catch(error){
        return error;
    } finally{

    }
};

async function PostLabel(req) { //NUEVO
    try {
        const newlabel = req.data.values;  // recupeaar los datos de la nueva label en el parametro req   
        if (!newlabel) { // si no se reciben datos, retornar un error
            return (new Error('No se reciben datos'));
        }
    
        const result = await ztlabels.insertOne(newlabel); // insertar la nueva label en la base de datos
        return JSON.parse(JSON.stringify(result)); // retornar el resultado de la insercion, en formato JSON
    } catch (error) {
        return error;
    }
}

async function DeleteLabel(req) {
    try {
        const id = req.data._id;// recupear el id de la label a eliminar del parametro req  
        
        if(!id) { // si no se recibe el id, retornar un error
            return (new Error('No se recibe id'));
        }

        const result = await ztlabels.deleteOne({ _id: id });        // eliminar la label en la base de datos
        return JSON.parse(JSON.stringify(result)); // retornar el resultado de la eliminacion, en formato JSON
    } catch (error) {
        return error;
    }
}

async function PutLabel(req) { //UPDATE
    try {
        const label = req.data.values;// recupeaar los datos nuevos de la label en el parametro req   
        const id = label._id; // identificamos el id ya existente de la label a actualizar
        console.log(label+"holaaaa"+id);
        
        if (!label || !id ) { // si no se reciben datos, retornar un error
            return (new Error('No se reciben datos'));
        }
        delete label._id; //borramos el _id de la label a actualizar, de la constante label


    const result = await ztlabels.updateOne(
      { _id: id }, //enviamos el id de la label a actualizar
      { $set: label } // y los datos nuevos de la label
    );// actualizar la label en la base de datos
        
        return JSON.parse(JSON.stringify(result)); // retornar el resultado de la actualizacion, en formato JSON
    } catch (error) {
        return error;
    }
}
module.exports = {GetAllLabels,PostLabel,DeleteLabel,PutLabel};