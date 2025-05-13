namespace inv;

entity priceshistory {
    key ID     : Integer;
        DATE   : DateTime;
        OPEN   : String;
        HIGH   : String;
        LOW    : Decimal;
        CLOSE  : Decimal;
        VOLUME : Decimal;
};



entity strategy {
    key ID          : String;
        NAME        : String;
        DESCRIPTION : String;

        INDICATORS  : array of {
            ID          : String;
            NAME        : String;
            DESCRIPTION : String;
        };

        DETAILSROW  : array of {
            ACTIVED        : Boolean default true;
            DELETED        : Boolean default false;
            DETAIL_ROW_REG : array of {
                CURRENT : Boolean;
                REGDATE : DateTime;
                REGTIME : DateTime;
                REGUSER : String;
            };
        };
};
