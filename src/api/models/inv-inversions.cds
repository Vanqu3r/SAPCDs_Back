namespace inv;

entity priceshistory{
    key ID    : Integer;
        DATE  : DateTime;
        OPEN  : String;
        HIGH  : String;
        LOW   : Decimal;
        CLOSE : Decimal;
        VOLUME: Decimal;
};

entity strategies{
    key ID          :Integer;
    NAME            :String;
    DESCRIPTION     :String;
    TIME            :Time;
    RISK            :Double;
};

