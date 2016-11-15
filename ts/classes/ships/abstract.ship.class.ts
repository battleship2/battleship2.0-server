/// <reference path="../../definitions/definitions.d.ts" />

import Utils = require("../../services/utils.service");
import BSData = require("../../definitions/bsdata");

let _utils: Utils = new Utils();

abstract class Ship {

    /**********************************************************************************/
    /*                                                                                */
    /*                                  PROPERTIES                                    */
    /*                                                                                */
    /**********************************************************************************/

    public hits: Array<BSCoordinates> = [];
    public coord: BSCoordinates = null;
    public bs_uuid: string = _utils.uuid();
    public destroyed: boolean = false;
    public dimensions: BSDimensions = null;

    /**********************************************************************************/
    /*                                                                                */
    /*                                  CONSTRUCTOR                                   */
    /*                                                                                */
    /**********************************************************************************/

    constructor(private _type: string, public size: number, x: number = 0, y: number = 0, public horizontal: boolean = true) {
        this.coord = {x : x, y : y};
        this.dimensions = {
            x : horizontal ? this.size : 1,
            y : horizontal ? 1 : this.size
        };
    }

    /**********************************************************************************/
    /*                                                                                */
    /*                                   ACCESSORS                                    */
    /*                                                                                */
    /**********************************************************************************/

    public get health(): number {
        return this.size - this.hits.length;
    };

    public get type(): string {
        return this._type;
    };

    public set type(type: string) {
        if (_utils.isString(type) && type.trim().length > 0) {
            this._type = type;
        }
    };

    /**********************************************************************************/
    /*                                                                                */
    /*                                PUBLIC MEMBERS                                  */
    /*                                                                                */
    /**********************************************************************************/

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

    public isOverlapping = (ship: Ship): boolean => {
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
