using {inv as myinv} from '../models/inv-inversions';
@impl: 'src/api/controllers/inv-inversions-controller.js'

service InversionsRoute @(path:'/api/inv') {

  entity indicatores as projection on myinv.indicatores;
  entity st as projection on myinv.strategy;
  //entity simulations as projection on myinv.Simulations;
  entity symbol as projection on myinv.symbols;
  entity PriceHistory as projection on myinv.PriceHistory;
entity Entsimulation as projection on myinv.SIMULATION;


 @Core.Description: 'PriceHistory'
  @path: 'priceshistorycrud' 
  action priceshistorycrud()
    returns array of PriceHistory;


  @Core.Description: 'get-all-indicators'
  @path: 'indicators' 
    action indicators(indicators: array of IndicatorInput)
    returns array of indicatores;

  @Core.Description: 'strategies'
  @path: 'strategy'
      action strategy()
      returns array of st;

  //Simulacion

  @Core.Description: 'simulations'
  @path: 'simulation'
  action simulation(SIMULATION:Entsimulation)
    returns array of Entsimulation;


 /* @Core.Description: 'get-all-simulations'
  @path: 'getallsimulations'
  function getallsimulations()
    returns array of simulations;
    
  @Core.Description: 'post-a-simulation'
  @path: 'simulate'
  action simulate(indicators: array of IndicatorInput,symbol:String,startDate: DateTime, endDate: DateTime, amount: Decimal(15,2), amountToBuy: Decimal(15,2),userId:String,simulationName:String)
    returns array of simulations;

  @Core.Description: 'update-simulation'
  @path: 'updatesimulationname'
  action updatesimulationname(simulation: simulations)
    returns array of simulations;
    
  @Core.Description: 'delete-simulation'
  @path: 'deletesimulation'
  action deletesimulation(simulation: simulations)
    returns array of simulations;
*/
    @Core.Description: 'get-all-symbols'
    function company()
        returns array of symbol;     
}
type IndicatorInput: {
  name: String;
  label: String;
  period: Integer;
  fast: Integer;
  slow: Integer;
  signal: Integer;
}
