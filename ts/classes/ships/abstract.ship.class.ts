/// <reference path="../../definitions/definitions.d.ts" />

import Utils = require("../../services/utils.service");
import BSData = require("../../definitions/bsdata");

import ShipCarrier = require("./ship.carrier.class");
import ShipBattleship = require("./ship.battleship.class");
import ShipCruiser = require("./ship.cruiser.class");
import ShipSubmarine = require("./ship.submarine.class");
import ShipDestroyer = require("./ship.destroyer.class");

let _utils: Utils = new Utils();

class Ship {

    /**********************************************************************************/
    /*                                                                                */
    /*                                  PROPERTIES                                    */
    /*                                                                                */
    /**********************************************************************************/

    public hits: Array<BSCoordinates> = [];
    public coord: BSCoordinates;
    public size: number;
    public bs_uuid: string = _utils.uuid();
    public destroyed: boolean = false;
    public horizontal: boolean = true;
    public dimensions: BSDimensions;

    private _type: string = "UNDEFINED";

    /**********************************************************************************/
    /*                                                                                */
    /*                                  CONSTRUCTOR                                   */
    /*                                                                                */
    /**********************************************************************************/

    constructor(type: string, size: number, x: number = 0, y: number = 0, horizontal: boolean = true) {
        this.coord = {x : x, y : y};
        this._type = type;
        this.size = size;
        this.dimensions = {
            x : horizontal ? this.size : 1,
            y : horizontal ? 1 : this.size
        };
    }

    /**********************************************************************************/
    /*                                                                                */
    /*                                PUBLIC MEMBERS                                  */
    /*                                                                                */
    /**********************************************************************************/

    public type = (_type?: string): string =>  {
        if (_utils.isUndefined(_type)) {
            return this._type;
        }
        this._type = _type;
        return this._type;
    };

    static getShips = (bs_ships: Array<BSShip>): Array<Ship> => {
        let ships = [];
        _utils.forEach(bs_ships, (bs_ship: BSShip) => {
            ships.push(Ship.getShip(bs_ship));
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
                throw new Error();
        }
    };

    public setFromBSShip = (ship: Ship): Ship => {
        this._type = ship.type();
        this.coord = {x : ship.dimensions.x, y : ship.dimensions.y};
        this.dimensions = {
            x : ship.horizontal ? this._type.length : 1,
            y : ship.horizontal ? 1 : this._type.length
        };
        this.hits = [];
        this.destroyed = false;
        return this;
    };

    public isAffectedByAction = (action: BSAction): boolean | BSCoordinates => {
        if (this.destroyed) {
            return false;
        }

        try {
            if (this.hits.length) {
                _utils.forEach(this.hits, (hit: BSCoordinates) => {
                    if (hit.x + this.coord.x === action.x && hit.y + this.coord.y === action.y) {
                        throw new Error();
                    }
                });
            }
        } catch (exception) { return false; }

        for (let x = 0; x < this.dimensions.x; ++x) {
            for (let y = 0; y < this.dimensions.y; ++y) {
                if (action.x === this.coord.x + x && action.y === this.coord.y + y) {
                    return { x: x, y: y };
                }
            }
        }
        return false;
    };

    public overlapping = (ship: Ship): boolean => {
        return this.coord.x + this.dimensions.x > ship.coord.x
            && this.coord.x < ship.coord.x + ship.dimensions.x
            && this.coord.y + this.dimensions.y > ship.coord.y
            && this.coord.y < ship.coord.y + ship.dimensions.y;
    };
}

/**********************************************************************************/
/*                                                                                */
/*                               PRIVATE MEMBERS                                  */
/*                                                                                */
/**********************************************************************************/

export = Ship;
