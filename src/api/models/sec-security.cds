namespace sec;

entity labels {
        COMPANYID  : String;
        CEDIID     : String;
        LABELID    : String;
        LABEL      : String;
        INDEX      : String;
        COLLECTION : String;
        SECTION    : String;
        SEQUENCE   : Integer;
        IMAGE      : String;
        DESCRIPTION: String;
        DETAIL_ROW : {
            ACTIVED : Boolean;
            DELETED : Boolean;
            DETAIL_ROW_REG:  array of   {
                    CURRENT : Boolean;
                    REGDATE : DateTime;
                    REGTIME : DateTime;
                    REGUSER : String;
            }
        };

};



  entity roles {
    ROLEID      : String;
    ROLENAME    : String;
    DESCRIPTION : String;
    PRIVILEGES  : array of {
        PROCESSID   : String;
        PRIVILEGEID : array of String;
    };
    DETAIL_ROW : {
        ACTIVED : Boolean;
        DELETED : Boolean;
        DETAIL_ROW_REG: array of {
            CURRENT : Boolean;
            REGDATE : DateTime;
            REGTIME : DateTime;
            REGUSER : String;
        }
    };
};

entity values {
        COMPANYID  : String;
        CEDIID     : String;
        LABELID    : String;
        VALUEPAID  : String;
        VALUEID    : String;
        VALUE      : String;
        ALIAS      : String;
        SEQUENCE   : Integer;
        IMAGE      : String;
        DESCRIPTION: String;
        DETAIL_ROW : {
            ACTIVED : Boolean;
            DELETED : Boolean;
            DETAIL_ROW_REG:  array of   {
                    CURRENT : Boolean;
                    REGDATE : DateTime;
                    REGTIME : DateTime;
                    REGUSER : String;
            }
        };
};

entity users{
    key USERID   : String;
        USERNAME : String;
        PASSWORD : String;
        ALIAS : String;
        FIRSTNAME :String;
        LASTNAME : String;
        EMAIL    : String;
        BIRTHDAYDATE : DateTime;
        COMPANYID : Decimal;
        COMPANYNAME :String;
        COMPANYALIAS: String;
        CEDIID: String;
        EMPLOYEEID: Decimal;
        PHONENUMBER: String;
        EXTENSION: String;
        DEPARTMENT: String;
        FUNCTION: String;
        STREET: String;
        POSTALCODE: Decimal;
        CITY: String;
        REGION: String;
        STATE: String;
        COUNTRY: String;
        AVATAR: String;
        ROLES : array of {
            ROLEID : String;
        };
        DETAIL_ROW : {
            ACTIVED : Boolean;
            DELETED : Boolean;
            DETAIL_ROW_REG:  array of   {
                    CURRENT : Boolean;
                    REGDATE : DateTime;
                    REGTIME : DateTime;
                    REGUSER : String;
            }
        };
};