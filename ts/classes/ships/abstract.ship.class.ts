/// <reference path="../../definitions/definitions.d.ts" />

import Utils = require("../../services/utils.service");
import BSData = require("../../definitions/bsdata");

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

    public health = (): number => {
        return this.size - this.hits.length;
    };

    public type = (_type?: string): string =>  {
        if (_utils.isUndefined(_type)) {
            return this._type;
        }
        this._type = _type;
        return this._type;
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
