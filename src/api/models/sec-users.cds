namespace sec;

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


/*
{
    "ROLES": [
        {
            "ROLEID": "IdWarehouseAssistant",
            "ROLENAME": "Auxiliar de Almacen",
            "DESCRIPTION": "Ayudante de Almacen de existencias",
            "PROCESSES": [
                {
                    "PROCESSID": "IdConteoInventario",
                    "PROCESSNAME": "Conteo de Inventario",
                    "APPLICATIONID":"APPLICATIONIDWARE",
                    "APLICATIONNAME":,
                    "VIEWID": ””,
                    "VIEWNAME": ””,
                    "PRIVILEGES": [
                        {
                            "PRIVILEGEID": "IdRead",
                            "PRIVILEGENAME": "Read"
                        },
                        {
                            "PRIVILEGEID": "IdUpdate",
                            "PRIVILEGENAME": "Update"
                        },
                        {
                            "PRIVILEGEID": "IdCreate",
                            "PRIVILEGENAME": "Create"
                        },
                        {
                            "PRIVILEGEID": "IdLogicDelete",
                            "PRIVILEGENAME": "Delete"
                        }
                    ]
                }
            ],
            "DETAIL_ROW": {
                "ACTIVED": true,
                "DELETED": false,
                "DETAIL_ROW_REG": [
                    {
                        "CURRENT": false,
                        "REGDATE": {
                            "$date": "2025-02-14T00:00:00.628Z"
                        },
                        "REGTIME": {
                            "$date": "1970-01-01T00:00:00.628Z"
                        },
                        "REGUSER": "FIBARRAC"
                    }
                ]
            }
        },
        {
            "ROLEID": "IdDesarrrolladorMercado",
            "ROLEIDSAP": ""
        }
    ],
    "DETAIL_ROW": {
        "ACTIVED": true,
        "DELETED": false,
        "DETAIL_ROW_REG": [
            {
                "CURRENT": false,
                "REGDATE": {
                    "$date": "2025-02-14T00:00:00.628Z"
                },
                "REGTIME": {
                    "$date": "2025-02-14T00:00:00.628Z"
                },
                "REGUSER": "FIBARRAC"
            },
            {
                "CURRENT": true,
                "REGDATE": {
                    "$date": "2025-02-18T00:00:00.628Z"
                },
                "REGTIME": {
                    "$date": "2025-02-18T00:00:00.628Z"
                },
                "REGUSER": "FIBARRAC"
            }
        ]
    }
}*/