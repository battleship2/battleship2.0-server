/// <reference path="../definitions/definitions.d.ts" />

import Utils = require("../services/utils.service");
import BSData = require("../definitions/bsdata");
import Socket = require("../classes/socket.class");
import BSPlugin = require("../plugins/abstract.bsplugin");

let _utils: Utils = new Utils();
let _peopleWritingInLobby: { [peopleId: string]: People } = {};

const _entityMap: { [symbol: string]: string } = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;", "/": "&#x2F;" };

class ChatPlugin extends BSPlugin {

    /**********************************************************************************/
    /*                                                                                */
    /*                                  PROPERTIES                                    */
    /*                                                                                */
    /**********************************************************************************/

    private _socket: Socket = null;

    /**********************************************************************************/
    /*                                                                                */
    /*                                  CONSTRUCTOR                                   */
    /*                                                                                */
    /**********************************************************************************/

    constructor() {
        super();
    }

    /**********************************************************************************/
    /*                                                                                */
    /*                                PUBLIC MEMBERS                                  */
    /*                                                                                */
    /**********************************************************************************/

    public setup(socket: Socket): ChatPlugin {
        this._socket = socket;

        this._socket.socket.on(BSData.events.on.MESSAGE, _message.bind(this));
        this._socket.socket.on(BSData.events.on.SOMEONE_IS_WRITING, _someoneIsWriting.bind(this));
        this._socket.socket.on(BSData.events.on.SOMEONE_STOPPED_WRITING, _someoneStoppedWriting.bind(this));

        this._socket.socket.emit(BSData.events.emit.PEOPLE_WRITING, _peopleWritingInLobby);

        return this;
    };

    public stop(): ChatPlugin {
        _handleWriting.call(this, "STOPPED_WRITING");
        return this;
    };

}

/**********************************************************************************/
/*                                                                                */
/*                               PRIVATE MEMBERS                                  */
/*                                                                                */
/**********************************************************************************/

function _handleWriting(status: string): ChatPlugin {
    let peopleWriting = {};

    if (!_utils.isNull(this._socket.game)) {
        peopleWriting = this._socket.game.handlePeopleWriting(status, this._socket);
    } else {
        switch (status) {
            case "STOPPED_WRITING":
                if (_utils.isDefined(_peopleWritingInLobby[this._socket.bs_uuid])) {
                    delete _peopleWritingInLobby[this._socket.bs_uuid];
                }
                break;

            case "IS_WRITING":
                if (_utils.isUndefined(_peopleWritingInLobby[this._socket.bs_uuid])) {
                    _peopleWritingInLobby[this._socket.bs_uuid] = {
                        id: this._socket.bs_uuid,
                        nickname: this._socket.nickname
                    };
                }
        }

        peopleWriting = _peopleWritingInLobby;
    }

    this._socket.dispatch(BSData.events.emit.PEOPLE_WRITING, peopleWriting);

    return this;
}

function _someoneIsWriting(): ChatPlugin {
    _handleWriting.call(this, "IS_WRITING");
    return this;
}

function _someoneStoppedWriting(): ChatPlugin {
    _handleWriting.call(this, "STOPPED_WRITING");
    return this;
}

function _message(message: string): ChatPlugin {
    if (!_utils.isString(message) || message.trim().length <= 0) {
        return this;
    }

    this._socket.dispatch(BSData.events.emit.MESSAGE, {
        id: this._socket.bs_uuid,
        date: new Date(),
        message: _makeSafeStringOf(message.trim()),
        nickname: this._socket.nickname
    });

    return this;
}

function _makeSafeStringOf(value: string): string {
    return String(value).replace(/[&<>"'\/]/g, (s: string) => {
        return _entityMap[s];
    });
}

export = ChatPlugin;
