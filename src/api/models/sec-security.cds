namespace sec;

entity labels {
    COMPANYID   : String;
    CEDIID      : String;
    LABELID     : String;
    LABEL       : String;
    INDEX       : String;
    COLLECTION  : String;
    SECTION     : String;
    SEQUENCE    : Integer;
    IMAGE       : String;
    DESCRIPTION : String;
    DETAIL_ROW  : {
        ACTIVED        : Boolean;
        DELETED        : Boolean;
        DETAIL_ROW_REG : array of {
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
    DETAIL_ROW  : {
        ACTIVED        : Boolean;
        DELETED        : Boolean;
        DETAIL_ROW_REG : array of {
            CURRENT : Boolean;
            REGDATE : DateTime;
            REGTIME : DateTime;
            REGUSER : String;
        }
    };
};

entity values {
    COMPANYID   : String;
    CEDIID      : String;
    LABELID     : String;
    VALUEPAID   : String;
    VALUEID     : String;
    VALUE       : String;
    ALIAS       : String;
    SEQUENCE    : Integer;
    IMAGE       : String;
    DESCRIPTION : String;
    DETAIL_ROW  : {
        ACTIVED        : Boolean;
        DELETED        : Boolean;
        DETAIL_ROW_REG : array of {
            CURRENT : Boolean;
            REGDATE : DateTime;
            REGTIME : DateTime;
            REGUSER : String;
        }
    };

};

entity catalogs {
    COMPANYID   : String;
    CEDIID      : String;
    LABELID     : String;
    LABEL       : String;
    INDEX       : String;
    COLLECTION  : String;
    SECTION     : String;
    SEQUENCE    : Integer;
    IMAGE       : String;
    DESCRIPTION : String;
    DETAIL_ROW  : {
        ACTIVED        : Boolean;
        DELETED        : Boolean;
        DETAIL_ROW_REG : array of {
            CURRENT : Boolean;
            REGDATE : DateTime;
            REGTIME : DateTime;
            REGUSER : String;
        }
    };
    VALUES      : array of {
        COMPANYID   : String;
        CEDIID      : String;
        LABELID     : String;
        VALUEPAID   : String;
        VALUEID     : String;
        VALUE       : String;
        ALIAS       : String;
        SEQUENCE    : Integer;
        IMAGE       : String;
        VALUESAPID   : String;
        DESCRIPTION : String;
        DETAIL_ROW  : {
            ACTIVED        : Boolean;
            DELETED        : Boolean;
            DETAIL_ROW_REG : array of {
                CURRENT : Boolean;
                REGDATE : DateTime;
                REGTIME : DateTime;
                REGUSER : String;
            }
        };
    };

};
