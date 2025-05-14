using {inv as myinv} from '../models/inv-inversions.cds';

@impl: 'src/api/controllers/inv-inversions-controller.js'

service InversionsRoute @(path:'/api/inv') {

  entity indicatores as projection on myinv.indicatores;
  entity symbol as projection on myinv.symbols;
    
  
  //indicadores
  @Core.Description: 'get-all-indicators'
  function indicators()
    returns array of indicatores;  


    //get all symbols
    @Core.Description: 'get-all-symbols'
    function company()
        returns array of symbol;

}
