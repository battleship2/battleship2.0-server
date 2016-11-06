/// <reference path="../../definitions/definitions.d.ts" />

import Ship = require("./abstract.ship.class");

class ShipCruiser extends Ship {
    constructor(x: number, y: number, horizontal: boolean = true) {
        super("CRUISER", 3, x, y, horizontal);
    }
}

export = ShipCruiser;
