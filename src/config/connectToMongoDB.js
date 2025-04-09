const mongoose = require ('mongoose'); 
const dotenXConfig = require('./dotenXConfig'); 

(async () => { 
    try { 
        const db = await mongoose.connect(dotenXConfig.CONNECTION_STRING, { 
            //useNewUrlParser: true, 
            //useUnifiedTopology: true, 
            dbName: dotenXConfig.DATABASE 
        }); 
        console.log('Database is connected to: ', db.connection.name); 
    } catch (error) { 
        console.log('Error: ', error); 
    } 
})();