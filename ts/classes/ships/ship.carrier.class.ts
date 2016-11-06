/// <reference path="../../definitions/definitions.d.ts" />

import Ship = require("./abstract.ship.class");

class ShipCarrier extends Ship {
    constructor(x: number, y: number, horizontal: boolean = true) {
        console.log(this);
        super("CARRIER", 5, x, y, horizontal);
    }
}

export = ShipCarrier;
