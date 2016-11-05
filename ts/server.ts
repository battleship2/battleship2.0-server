/// <reference path="definitions/definitions.d.ts" />


(() => {
    global.DEBUG_ENABLED = (require.main === module) || true /*__debugEnabled__*/;

    let SocketClass: any = require("./classes/socket.class");
    let ServerClass: any = require("./classes/server.class");

    let server = new ServerClass();
    let socket = new SocketClass();

    socket.init(server.get());
    server.start();
})();
