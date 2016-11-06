/// <reference path="../../definitions/definitions.d.ts" />

import Ship = require("./abstract.ship.class");

class ShipSubmarine extends Ship {
    constructor(x: number, y: number, horizontal: boolean = true) {
        super("SUBMARINE", 3, x, y, horizontal);
    }
}

export = ShipSubmarine;
