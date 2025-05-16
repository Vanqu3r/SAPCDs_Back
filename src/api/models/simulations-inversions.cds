namespace inv;

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
  userId               : String;
  idStrategy           : String;
  simulationName       : String;
  symbol               : String;
  startDate            : DateTime;
  endDate              : DateTime;
  amount               : Decimal9_2;
  amountToBuy          : Decimal9_2;
  specs                : String;

  signals              : Composition of many Signal;
  result               : Decimal9_2;
  percentageReturn     : Decimal9_2;

  DETAIL_ROW           : Composition of one userdetailrow;
}
