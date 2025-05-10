namespace inv;

entity indicators {
  key _id         : UUID;
  symbol          : String;
  name            : String;
  assetType       : String;
  interval        : String;
  timezone        : String;
  data            : LargeString; // o Composition of structure si prefieres estructurar
}
