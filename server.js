var express = require('express');
var sanitize = require('validator').sanitize;
var app = express();
var path = require('path');

app.use(express.static(path.join(__dirname, '')));

app.configure(function(){
  app.set('views', __dirname);
  app.set('view engine', 'ejs');
  app.set('view options', {layout: false});
  app.use(express.json()); 
  app.use(express.urlencoded());
  app.use(express.methodOverride());
});

app.get('/', function(req, res){
  res.render('index');
});

app.get('/chat', function(req, res){
  res.redirect('/');
});

app.post('/chat', function(req, res){
  var user = req.body.user;
  if(user.nome == "") {
    res.redirect('/');
  } else {
    res.render('chat', {user:user});
  }
});


var usuarios = new Array();
var io = require('socket.io').listen(app.listen(9612));
 
io.sockets.on('connection', function(socket) {
    socket.emit("message_to_client",{ message: 'Bem vindo ao chat do Thales!' });

    socket.on('message_to_server', function(data) {
        var escaped_message = sanitize(data["message"]).escape();
        if(escaped_message != "") {
          socket.get('nickname', function (err, name) {
              io.sockets.emit("message_to_client",{ message: '<strong>'+name+'</strong> diz: '+escaped_message });
          });
        }
        
    });

    socket.on('novo_usuario', function(data) {
        var escaped_message = sanitize(data["nome"]).escape();

        socket.set('nickname', escaped_message);  
        usuarios[socket.id] = socket;

        atualiza_lista(usuarios);

        var msg = '<strong>'+ escaped_message + '</strong> entrou na sala.';
        io.sockets.emit("message_to_client", { message : msg });
 

    });

    socket.on('disconnect', function() {
        socket.get('nickname', function (err, name) {
          io.sockets.emit("message_to_client",{ message: '<strong>'+name+'</strong> saiu da sala.' });
          
          delete usuarios[socket.id];
          atualiza_lista(usuarios);
        });
    });
    

});

function atualiza_lista(usuarios) {
    var lista = [];

    for (var i in usuarios) {
      var sock = usuarios[i];
      sock.get('nickname', function (err, name) {
        lista.push(name);
      });
    }

    io.sockets.emit("lista",{ lista: lista });
}