using {inv as myinv} from '../models/simulations-inversions';
@impl: 'src/api/controllers/inv-simulations-controller.js'

service SimulationsRoute @(path:'/api/sim') {

    entity simulations as projection on myinv.Simulations;

    function getallsimulations()
        returns array of simulations;
    
    action simulate(simulation: simulations)
        returns array of simulations;

    action updatesimulationname(simulation: simulations)
        returns array of simulations;
    
    action deletesimulation(simulation: simulations)
        returns array of simulations;

}
