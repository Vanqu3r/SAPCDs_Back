using {inv as myinv} from '../models/indicadors-inversions.cds';
@impl: 'src/api/controllers/sec-indicadors-controller.js'

service IndicatorsRoute @(path:'/api/inv/indicators') {

  entity indicators as projection on myinv.indicators;

  @Core.Description: 'get-all-indicators'
  @path: 'getall'
  function getall()
    returns array of indicators;



}
