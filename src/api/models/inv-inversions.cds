namespace inv;

entity PriceHistory {
    key symbol    : String;
        name      : String;
        assetType : String;
        interval  : String;
        timezone  : String;

        data : array of {
            DATE   : DateTime;
            OPEN   : Decimal(15,4);
            HIGH   : Decimal(15,4);
            LOW    : Decimal(15,4);
            CLOSE  : Decimal(15,4);
            VOLUME : Integer;
        };
}


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

type Decimal9_2 : Decimal(9,2);

// Subentidad: Signals
entity Signal {
  parent              : Association to Simulations;
  date                : DateTime;
  type                : String;
  price               : Decimal9_2;
  reasoning           : String;
}

// Subentidad: auditoria
entity userdetailrow {
    ACTIVED         : Boolean;
    DELETED         : Boolean;
    DETAIL_ROW_REG  : Composition of many userrowreg;
}

entity userrowreg {
        CURRENT : Boolean;
        REGDATE : DateTime;
        REGTIME : DateTime;
        REGUSER : String;
        parent  : Association to userdetailrow;
}

// Entidad principal: Simulación
entity Simulations {
  key idSimulation     : String;
  idUser               : String;
  idStrategy           : String;
  simulationName       : String;
  symbol               : String;
  startDate            : DateTime;
  endDate              : DateTime;
  amount               : Decimal9_2;
  specs                : String;

  signals              : Composition of many Signal;
  result               : Decimal9_2;
  percentageReturn     : Decimal9_2;

  DETAIL_ROW           : Composition of one userdetailrow;
}

entity indicatores {
  key _id         : UUID;
  symbol          : String;
  name            : String;
  strategy        : String;
  assetType       : String;
  interval        : String;
  timezone        : String;
  data            : LargeString; 
}


entity symbols  {
    key symbol : String;
        name : String;
        exchange : String;
        assetType: String;
};
