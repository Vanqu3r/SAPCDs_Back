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

entity indicatores {
  key _id         : UUID;
  symbol          : String;
  name            : String;
  strategy        : String;
  assetType       : String;
  interval        : String;
  timezone        : String;
  data            : LargeString; // o Composition of structure si prefieres estructurar
}


entity symbols  {
    key symbol : String;
        name : String;
        exchange : String;
        assetType: String;
};
