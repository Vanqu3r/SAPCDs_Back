using {inv as myinv} from '../models/inv-inversions';

@impl: 'src/api/controllers/inv-inversions-controller.js'

service InversionsRoute @(path: '/api/inv') {

  entity indicatores   as projection on myinv.indicatores;
  entity st            as projection on myinv.strategy;
  //entity simulations as projection on myinv.Simulations;
  entity symbol        as projection on myinv.symbols;
  entity PriceHistory  as projection on myinv.PriceHistory;
  entity Entsimulation as projection on myinv.SIMULATION;
  entity PB            as projection on myinv.portafolioBody;
  entity Portafolio    as projection on myinv.PORTAFOLIO;


  @Core.Description: 'PriceHistory'
  @path            : 'priceshistorycrud'
  action   priceshistorycrud()                              returns array of PriceHistory;


  @Core.Description: 'get-all-indicators'
  @path            : 'indicators'
  action   indicators(indicators : array of IndicatorInput) returns array of indicatores;

  @Core.Description: 'strategies'
  @path            : 'strategy'
  function strategy()                                       returns array of st;

  @Core.Description: 'get-all-symbols'
  function company()                                        returns array of symbol;


  //Simulacion

  @Core.Description: 'simulations'
  @path            : 'simulation'
  action   simulation(SIMULATION : Entsimulation)           
  returns array of Entsimulation;

  @Core.Description: 'portafolio'
  @path            : 'portafolio'
  action   portafolio(RESUMENSIMU:PB)                                     
  returns array of Portafolio;


  @Core.Description: 'simulationsCRUD'
  @path            : 'simulationCrud'
  action   simulationCrud(SIMULATIONNAME : String)          returns array of Entsimulation;


}


type IndicatorInput : {
  name   : String;
  label  : String;
  period : Integer;
  fast   : Integer;
  slow   : Integer;
  signal : Integer;
}
