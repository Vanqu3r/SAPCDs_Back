using { inv } from '../models/inv-inversions';

@impl: 'src/api/controllers/inv-strategy-controller.js'

service StrategyRoute @(path: '/api/inv') {
    entity st as projection on inv.strategy;

    // get all users
    //localhost4004/api/sec/usersCRUD
    @Core.Description: 'crud-for-users'
    @path: 'strategy'
        function strategy()
        returns array of st;

};