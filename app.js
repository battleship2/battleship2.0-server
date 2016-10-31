var restify = require('restify'),
    socket = require('./src/socket.js'),
    io = require('socket.io');

var server = restify.createServer();

socket(io.listen(server.server));

server.listen(9001, function () {
    console.log('server open at: %s', server.url);
});
