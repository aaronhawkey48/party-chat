var express = require('express');
var redis2 = require('redis');
var hbs = require('hbs');
var bodyParser = require('body-parser');
var app = express();
var redis = require('socket.io-redis');
var server = require('http').Server(app);
var io = require('socket.io').listen(server);
var cron = require('node-cron');


app.use(bodyParser.json());

if(process.env.REDIS_ENDPOINT){
    io.adapter(redis({ host: process.env.REDIS_ENDPOINT, port: 6379 }));
    var rClient = redis2.createClient(`redis://${process.env.REDIS_ENDPOINT}`);
    console.log('Connection to Redis made.');
}

app.set('view engine', 'hbs');

server.listen(process.env.PORT || 3000, () => console.log(`App listening on port ${process.env.PORT || 3000}`))

app.get('/', (req, res) => {
    res.render('index', {url: process.env.URL || 'localhost:3000'});
});

app.post('/match-ready/:partyId', (req, res) => {
    io.in(req.params.partyId).emit('match-ready', {event: 'match ready'});
    res.status(200).send({status: 'ok'});
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

    socket.on('enter-queue', ({ partyId, game }) => {
        console.log('In Queue Now');
        console.log(`PartyId: ${partyId}`);
        console.log(`Game: ${game}`);
        rClient.set(`queue:${game}:party:${partyId}`, 'inQueue');

    });

});


if(process.env.CRON_STATUS == 'true') {
    console.log('in if');
    cron.schedule("*/5 * * * * *", () => {
        var today = new Date();
        var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        console.log(time);
      });
}