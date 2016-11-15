/// <reference path="../definitions/definitions.d.ts" />

import Socket = require("../classes/socket.class");

abstract class BSPlugin {

    /**********************************************************************************/
    /*                                                                                */
    /*                                  CONSTRUCTOR                                   */
    /*                                                                                */
    /**********************************************************************************/

    constructor() {}

    /**********************************************************************************/
    /*                                                                                */
    /*                               ABSTRACT MEMBERS                                 */
    /*                                                                                */
    /**********************************************************************************/

    abstract stop(): void;
    abstract setup(socket: Socket): void;

}

export = BSPlugin;
