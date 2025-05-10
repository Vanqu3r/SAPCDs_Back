namespace inv;

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
