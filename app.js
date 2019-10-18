var express = require('express');
var app = express();
var server = require('http').Server(app)
var io = require('socket.io').listen(server)

server.listen(3000, ()=> console.log(`App listening on port 3000`))

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    
    socket.on('create-party', (party) => {
        socket.join(party);
        // io.sockets.in(party).emit('message', `You are now connected to ${party}`);
    });

    socket.on('message', ({room, message, sender}) => {
        io.in(room).emit('message', {message, sender});
    });

    socket.on('join-party', (party) => {
        socket.join(party);
        io.sockets.in(party).emit('party-join-success-' + socket.id, {response: 'successs'});
    });

});