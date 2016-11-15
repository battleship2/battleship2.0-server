/// <reference path="../../definitions/definitions.d.ts" />

import Utils = require("../../services/utils.service");

let _utils: Utils = new Utils();

import Ship = require("./abstract.ship.class");
import ShipCarrier = require("./ship.carrier.class");
import ShipCruiser = require("./ship.cruiser.class");
import ShipSubmarine = require("./ship.submarine.class");
import ShipDestroyer = require("./ship.destroyer.class");
import ShipBattleship = require("./ship.battleship.class");

class ShipFactory {

    static getShips = (bs_ships: Array<BSShip>): Array<Ship> => {
        let ships = [];
        _utils.forEach(bs_ships, (bs_ship: BSShip) => {
            ships.push(ShipFactory.getShip(bs_ship));
        });
        return ships;
    };

    static getShip = (bs_ship: BSShip): Ship => {
        let x = bs_ship.x,
            y = bs_ship.y,
            horizontal = bs_ship.horizontal;

        switch (bs_ship.type) {
            case "CARRIER":
                return new ShipCarrier(x, y, horizontal);
            case "BATTLESHIP":
                return new ShipBattleship(x, y, horizontal);
            case "CRUISER":
                return new ShipCruiser(x, y, horizontal);
            case "SUBMARINE":
                return new ShipSubmarine(x, y, horizontal);
            case "DESTROYER":
                return new ShipDestroyer(x, y, horizontal);
            default:
                throw new Error("Unknown ship: " + bs_ship.type);
        }
    };

}

export = ShipFactory;
