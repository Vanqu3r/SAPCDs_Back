using {inv as myinv} from '../models/inv-inversions';
 @impl: 'src/api/controllers/inv-inversions-controller.js' 

service PricesHistoryRoute @(path:'/api/inv'){
    
    //entity priceshistory as projection on myinv.priceshistory;
    //entity strategies as projection on myinv.strategies;   
    entity priceshistory as projection on myinv.priceshistory;
    entity strategies as projection on myinv.strategy;

    // get all prices history

    //localhost4004/api/inv/priceshistory/getall

    @Core.Description: 'get-all-prices-history'
    @path: 'getall'
        function getall()
        returns array of priceshistory;

    @Core.Description: 'add-one-prices-history'
    @path: 'addone'
        action addone(prices:priceshistory) returns array of priceshistory;
    
    @Core.Description: 'delete-one-prices-history'
    @path: 'deleteone'
        action deleteone() 
        returns array of priceshistory;



    //get some prices history
    /*
    localhost4004/api/inv/priceshistory/getsome

    //get one price history

    localhost4004/api/inv/priceshistory/getone

    //put one price history

    localhost4004/api/inv/priceshistory/putone

    //delete one price history

    localhost4004/api/inv/priceshistory/deleteone
    */

};