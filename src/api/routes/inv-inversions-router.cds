using {inv as myinv} from '../models/inv-inversions';
@impl: 'src/api/controllers/inv-inversions-controller.js'

service InversionsRoute @(path:'/api/inv') {

  entity indicatores as projection on myinv.indicatores;
  entity st as projection on myinv.strategy;
  entity simulations as projection on myinv.Simulations;

  @Core.Description: 'get-all-indicators'
  @path: 'indicators' 
  function indicators()
    returns array of indicatores;

  @Core.Description: 'strategies'
  @path: 'strategy'
      function strategy()
      returns array of st;

  @Core.Description: 'get-all-simulations'
  @path: 'getallsimulations'
  function getallsimulations()
    returns array of simulations;
    
  @Core.Description: 'post-a-simulation'
  @path: 'simulate'
  action simulate(simulation: simulations)
    returns array of simulations;

  @Core.Description: 'update-simulation'
  @path: 'updatesimulationname'
  action updatesimulationname(simulation: simulations)
    returns array of simulations;
    
  @Core.Description: 'delete-simulation'
  @path: 'deletesimulation'
  action deletesimulation(simulation: simulations)
    returns array of simulations;

}
