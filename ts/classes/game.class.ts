/// <reference path="../server.ts" />

import Utils = require('../services/utils.service');

let _utils: Utils = new Utils();
let _instance: Game = null;

class Game {

    /**********************************************************************************/
    /*                                                                                */
    /*                                  PROPERTIES                                    */
    /*                                                                                */
    /**********************************************************************************/



    /**********************************************************************************/
    /*                                                                                */
    /*                                  CONSTRUCTOR                                   */
    /*                                                                                */
    /**********************************************************************************/

    constructor(id: string, name: string, maxPlayers: number, password: string) {
        if (_utils.isNull(_instance)) {
            _instance = this;
        }

        return _instance;
    }

    /**********************************************************************************/
    /*                                                                                */
    /*                                PUBLIC MEMBERS                                  */
    /*                                                                                */
    /**********************************************************************************/

    public state = () : BSGameState => {
        return BSGameState.READY;
    };

    public getId = () : string => {
        return '';
    };

    public map = () : {ships: Array<any>} => {
        return { ships: [] };
    };

    public hasEveryonePlayedTheTurn = () : boolean => {
        return false;
    };

    public isStillPlayable = () : boolean => {
        return false;
    };

    public removeAllPlayers = (players: {}) : Game => {
        return _instance;
    };

    public emit = (io: any, event: string, data?: any) : Game => {
        return _instance;
    };

    public countPlayers = () : number => {
        return 0;
    };

    public playTheTurn = () : Game => {
        return _instance;
    };

    public setNextActions = (player: BSPlayer, data: any) : Game => {
        return _instance;
    };

    public setPlayerReady = (player: BSPlayer, ready: any) : Game => {
        return _instance;
    };

    public placePlayerShips = (player: BSPlayer, ships: any) : Game => {
        return _instance;
    };

    public acceptPlayer = (player: BSPlayer, data: any) : Game => {
        return _instance;
    };

    public summary = () : Game => {
        return _instance;
    };

    public addPlayer = (player: BSPlayer) : Game => {
        return _instance;
    };

    public removePlayer = (player: BSPlayer) : Game => {
        return _instance;
    };

    /**********************************************************************************/
    /*                                                                                */
    /*                               PRIVATE MEMBERS                                  */
    /*                                                                                */
    /**********************************************************************************/

}

export = Game;
