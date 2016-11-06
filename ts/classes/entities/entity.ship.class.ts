/// <reference path="../../definitions/definitions.d.ts" />

import Utils = require("../../services/utils.service");
import BSData = require("../../definitions/bsdata");
import ShipType = BSData.ShipType;

let _utils: Utils = new Utils();

class Ship {
    public bs_uuid: string;
    public type: ShipType = ShipType.BATTLESHIP;
    public length: number;
    public coord: BSCoordinates;
    public dimensions: BSDimensions;
    public hits: Array<BSCoordinates> = [];
    public destroyed: boolean;

    constructor(x: number = 0, y: number = 0, horizontal: boolean = true, type: ShipType = ShipType.BATTLESHIP) {
        this.bs_uuid = _utils.uuid();
        this.type = type;
        this.coord = {x : x, y : y};
        this.length = Ship.getShipLength(this.type);
        this.dimensions = {
            x : horizontal ? this.length : 1,
            y : horizontal ? 1 : this.length
        };
        this.hits = [];
        this.destroyed = false;
    }

    public setFromBSShip(ship: BSShip) {
        this.type = ship.type;
        this.length = Ship.getShipLength(ship.type);
        this.coord = {x : ship.x, y : ship.y};
        this.dimensions = {
            x : ship.horizontal ? this.length : 1,
            y : ship.horizontal ? 1 : this.length
        };
        this.hits = [];
        this.destroyed = false;
    }

    public isAffectedByAction(action: BSAction): boolean | BSCoordinates {
        if (this.destroyed) return false;

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
    }

    public overlapping (ship: Ship): boolean {
        return this.coord.x + this.dimensions.x > ship.coord.x
            && this.coord.x < ship.coord.x + ship.dimensions.x
            && this.coord.y + this.dimensions.y > ship.coord.y
            && this.coord.y < ship.coord.y + ship.dimensions.y;
    }

    static getShipLength(type: ShipType): number {
        switch (type) {
            case ShipType.CARRIER:
                return 5;
            case ShipType.BATTLESHIP:
                return 4;
            case ShipType.CRUISER:
                return 3;
            case ShipType.SUBMARINE:
                return 3;
            case ShipType.DESTROYER:
                return 2;
        }
        return 2;
    }
}

export = Ship;
