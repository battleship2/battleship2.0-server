/// <reference path="../../definitions/definitions.d.ts" />

import Ship = require("./abstract.ship.class");

class ShipBattleship extends Ship {
    constructor(x: number, y: number, horizontal: boolean = true) {
        console.log(this);
        super("BATTLESHIP", 4, x, y, horizontal);
    }
}

export = ShipBattleship;
