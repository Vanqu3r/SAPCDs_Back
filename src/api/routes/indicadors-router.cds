using {inv as myinv} from '../models/indicadors-inversions.cds';
@impl: 'src/api/controllers/sec-indicadors-controller.js'

service IndicatorsRoute @(path:'/api/inv') {

  entity indicatores as projection on myinv.indicatores;

  @Core.Description: 'get-all-indicators'

  function indicators()
    returns array of indicatores;

}
