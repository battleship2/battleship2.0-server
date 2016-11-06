/// <reference path="../../definitions/definitions.d.ts" />

import Utils = require("../../services/utils.service");
import BSData = require("../../definitions/bsdata");
import Ship = require("./abstract.ship.class");

class ShipDestroyer extends Ship {
    constructor(x: number, y: number, horizontal: boolean = true) {
        super("DESTROYER", 2, x, y, horizontal);
    }
}

export = ShipDestroyer;
