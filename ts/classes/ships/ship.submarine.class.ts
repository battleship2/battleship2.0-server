/// <reference path="../../definitions/definitions.d.ts" />

import Utils = require("../../services/utils.service");
import BSData = require("../../definitions/bsdata");
import Ship = require("./abstract.ship.class");

class ShipSubmarine extends Ship {
    constructor(x: number, y: number, horizontal: boolean = true) {
        super("SUBMARINE", 3, x, y, horizontal);
    }
}

export = ShipSubmarine;
