using { sec } from '../models/sec-users';

@impl: 'src/api/controllers/sec-users-controller.js'

service UsersRoute @(path: '/api/sec') {
    entity users as projection on sec.users;

    // get all users
    //localhost4004/api/sec/usersCRUD
    @Core.Description: 'crud-for-users'
    @path: 'usersCRUD'
        function usersCRUD()
        returns array of users;

};