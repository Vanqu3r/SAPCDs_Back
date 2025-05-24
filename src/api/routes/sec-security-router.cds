using {sec as mysec} from '../models/sec-security';

@impl: 'src/api/controllers/sec-security-controller.js'


service SecurityRoute @(path: '/api/sec') {
    entity roles    as projection on mysec.roles;
    entity labels   as projection on mysec.labels;
    entity values   as projection on mysec.values;
    entity users as projection on mysec.users;
    entity catalogs as projection on mysec.catalogs;

    @Core.Description: 'CRUD de Roles'
    @path            : 'rolesCRUD'
    action rolesCRUD()
    returns array of roles;

    // GET ALL ROLES
    // http://localhost:4004/api/sec/rolesCRUD?procedure=get&type=all

    // GET ALL ROLES WITH USERS
    // http://localhost:4004/api/sec/rolesCRUD?procedure=get&type=users

    // POST ROLE
    // http://localhost:4004/api/sec/rolesCRUD?procedure=post

    // DELETE LOGIC
    // http://localhost:4004/api/sec/rolesCRUD?procedure=delete&type=logic&roleid=IdSecurityPrUEBA3

    // BORRADO FISICO
    // http://localhost:4004/api/sec/rolesCRUD?procedure=delete&type=hard&roleid=IdSecurityPrUEBA3

    // ACTUALIZAR
    // http://localhost:4004/api/sec/rolesCRUD?procedure=put&roleid=IdSecurityPrUEBA3


    @Core.Description: 'CRUD de values'
    @path            : 'valuesCRUD'
    action valuesCRUD() returns array of values;

    // //----------LABELS----------------------

    // @Core.Description: 'get-all-labels'
    // @path            : 'getall'
    // function getall()     returns array of labels;

    // @Core.Description: 'new Label'
    // @path            : 'newLabel'
    // action newLabel(values:labels)  
    // returns array of labels;

    // @Core.Description: 'DELETE Label'
    // @path            : 'deleteLabel'
    // action deleteLabel()  
    // returns array of labels;

    // @Core.Description: 'UPDATE Label'
    // @path            : 'updateLabel'
    // action updateLabel(values:labels)  
    // returns array of labels;

    // @Core.Description: 'LOGICAL Label'
    // @path            : 'logicalLabel'
    // action logicalLabel()
    // returns array of labels;
    // GET ALL CATALOGS
    // http://localhost:4004/api/sec/catalogsR?procedure=get&type=all

    // GET CATALOG BY LABELID
    // http://localhost:4004/api/sec/catalogsR?procedure=get&type=bylabelid&&labelid=IdApplications

    // GET CATALOG BY LABELID && VALUEID
    // http://localhost:4004/api/sec/catalogsR?procedure=get&type=bylabelid&&labelid=IdApplications&&valueid=IdSecurity

    @Core.Description: 'Read de catalogs'
    @path            : 'catalogsR'
    function catalogsR()  returns array of catalogs;

    @Core.Description: 'crud-for-users'
    @path: 'usersCRUD'
        action usersCRUD()
        returns array of users;

    @Core.Description: 'crud-for-labels'
    @path: 'labelsCRUD'
        action labelsCRUD()
        returns array of labels;
}
