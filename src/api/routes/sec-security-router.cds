using {sec as mysec} from '../models/sec-security';

@impl: 'src/api/controllers/sec-security-controller.js'

service SecurityRoute @(path: '/api/sec') {
    entity roles  as projection on mysec.roles;
    entity labels as projection on mysec.labels;
    entity values as projection on mysec.values;

    @Core.Description: 'CRUD de Roles'
    @path            : 'rolesCRUD'
    function rolesCRUD() returns array of roles;

    @Core.Description: 'CRUD de values'
    @path            : 'valuesCRUD'
    function valuesCRUD() returns array of values;

    // API GET ALL ROLES 
    // http://localhost:4004/api/secc/rolesCRUD?procedure=get&type=all 

    // API GET ALL ROLES WITH USERS
    // http://localhost:4004/api/sec/rolesCRUD?procedure=get&type=users

    // API POST ROLE
    // http://localhost:4004/api/sec/rolesCRUD?procedure=post



    @Core.Description: 'get-all-labels'
    @path            : 'getall'
    function getall()    returns array of labels;
}
