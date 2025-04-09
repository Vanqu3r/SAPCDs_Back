namespace x;

entity priceshistory{
    key ID    : Integer;
        DATE  : DateTime;
        OPEN  : String;
        HIGH  : String;
        LOW   : Decimal;
        CLOSE : Decimal;
        VOLUME: Decimal;
};