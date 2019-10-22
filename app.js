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
        rClient.set(`queue:${game}:party:${partyId}`, 'inQueue');

    });

});


if(process.env.CRON_STATUS == 'true') {
    cron.schedule("*/5 * * * * *", () => {
        rClient.keys('queue:csgo:party:*', (err, res) => {
            // Checks to see if there is at least more than one person in queue
            if(res.length <= 1) {
                console.log('No potential matches');
                return;
            }

            // Gets values for the keys if more than 1 exist
            for(var i = 0; i < res.length - 1; i=i+2) {

                var party1 = res[i].split(':')[3];
                var party2 = res[i+1].split(':')[3];
                
                console.log(`p1: `+ party1);
                console.log(`p2: `+ party2);

                // Notify Queue Pop
                io.sockets.in(party1).emit('match-ready', {response: 'Queue Popped'});
                io.sockets.in(party2).emit('match-ready', {response: 'Queue Popped'});

                // Remove keys
                rClient.del(res[i]);
                rClient.del(res[i+1]);
            }

        });
    });
}