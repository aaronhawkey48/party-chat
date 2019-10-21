var express = require('express');
var hbs = require('hbs');
var app = express();
var redis = require('socket.io-redis');
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

io.adapter(redis({ host: process.env.REDIS_ENDPOINT, port: 6379 }));

app.set('view engine', 'hbs');

server.listen(process.env.PORT || 3000, () => console.log(`App listening on port ${process.env.PORT || 3000}`))

app.get('/', (req, res) => {
    res.render('index', {url: process.env.URL || 'localhost:3000'});
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