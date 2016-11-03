/**********************************************************************************/
/*                                                                                */
/*                                    LIBRARIES                                   */
/*                                                                                */
/**********************************************************************************/

/// <reference path="../../node_modules/@types/node/index.d.ts" />
/// <reference path="../../node_modules/@types/bunyan/index.d.ts" />
/// <reference path="../../node_modules/@types/restify/index.d.ts" />
/// <reference path="../../node_modules/@types/socket.io/index.d.ts" />

/**********************************************************************************/
/*                                                                                */
/*                                    OVERRIDES                                   */
/*                                                                                */
/**********************************************************************************/

declare module NodeJS  {
    interface Global {
        DEBUG_ENABLED: boolean
    }
}

declare module SocketIO  {
    interface Socket {
        id: string
        game: any
        nickname: string
    }
}

declare module BSData {
    enum State { READY, PLAYING, SETTING, WAITING_PLAYERS }
    enum ActionType { BOMB }
}

/**********************************************************************************/
/*                                                                                */
/*                                    INTERFACES                                  */
/*                                                                                */
/**********************************************************************************/

interface BSGameData {
    id: string
    name: string
    password: string
    maxPlayers: number
}

interface BSBuffer {
    games: {}
    sockets: {}
}

interface BSPlayer {
    id: string
    on: Function
    game: any
    emit: Function
    join: Function
    leave: Function
    nickname: string
}

interface BSCoordinates {
    x: number
    y: number
}

interface BSShip {
    x: number
    y: number
    id: string
    hits: Array<BSCoordinates>
    type: string
    width: number
    height: number
    destroyed: boolean
}

interface BSAction {
    x: number
    y: number
    id: string
    type: BSData.ActionType
    owner: string
    result: Array<any>
}

interface BSMap {
    max: { action: number }
    ships: {}
    width: number
    height: number
    boards: {}
}


