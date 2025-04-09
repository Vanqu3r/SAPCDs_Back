const ztpriceshistory = require('../models/mongodb/ztpriceshistory');

async function GetAllPricesHistory(req) {
    try{
        const IdPrice = parseInt(req.req.query?.IdPrice);
        const StartVolume = parseInt(req.req.query?.StartVolume);
        const EndVolume = parseInt(req.req.query?.EndVolume);
        //let {IDPrice} = req.req.query;
        //IdPrice = parseInt(IDPrice);
        let pricesHistory;
        if (IdPrice>=0){
            pricesHistory = await ztpriceshistory.findOne({ID:IdPrice}).lean();
        }else if(Number.isFinite(StartVolume)==true && Number.isFinite(EndVolume)==true && EndVolume>=StartVolume){
            pricesHistory = await ztpriceshistory.find({VOLUME:{$gte:StartVolume,$lte:EndVolume}}).lean();
        }else{
            pricesHistory = await ztpriceshistory.find().lean();
        }
        return (pricesHistory)
    } catch(error){
        return error;
    } finally{

    }
};

async function AddOnePricesHistory(req) {
    try{
        const newPrices = req.req.body.prices;
        let pricesHistory;
        pricesHistory = await ztpriceshistory.insertMany(newPrices,{
            order:true,
        });
        return JSON.parse(JSON.stringify(pricesHistory));
    } catch(error){
        throw error;
    } finally{

    }
};

async function DeleteOnePricesHistory(req) {
    try{
        const IdPrice = parseInt(req.req.query?.IdPrice);
        console.log('ID para eliminar:', IdPrice);  // Verifica que IdPrice es el esperado
        let pricesHistory;
        if (IdPrice>=0){
            pricesHistory = await ztpriceshistory.findOneAndDelete({ID:IdPrice});
            console.log('Dato eliminado:', pricesHistory);  // Verifica que el documento se eliminó correctamente
        }else{
            console.log('No ID provided for deletion');
        }
    } catch(error){
        return error;
    } finally{

    }
};


module.exports = {GetAllPricesHistory,AddOnePricesHistory,DeleteOnePricesHistory};