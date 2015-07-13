// listen for cmds, forward them to phoenix method calls
//
// first cut:
//   POST /walk?dir=[fwd|rev|f|r]&speed=[value]
//   POST /run?dir=[fwd|rev|f|r]&speed=[value]
//   POST /row?dir=[fwd|rev|f|r]&speed=[value]
//   POST /turn?dir=[right|left|r|l]&speed=[value]
//   POST /wave?side=[right|left|r|l]&joint=[coxa|femur|tibia|c|f|t]
//   POST /stop
//   POST /wake
//   POST /sleep
//   POST /quit
//

var COMMAND_HTTP_PORT = 6543;

// class/global vars
var util = require('util');
var express = require('express');
var eventEmitter = require('events').EventEmitter;
var util = require('util');

var ph;
var app;

CommandProcessor = function(phoenix) {
  eventEmitter.call(this);
  ph = phoenix;
  app = express();
}

util.inherits(CommandProcessor, eventEmitter);

CommandProcessor.prototype.run = function() {

  var self = this;

  app.get('/wake', function(req, res) {
    ph.wake();
    res.sendStatus(200);
  });

  app.get('/quit', function(req, res) {
    res.sendStatus(200);
    // console.log("in quit, app = ", util.inspect(app, {depth:3}));
    commandServer.close();
    console.log("from CommandProcessor: ", util.inspect(self.emit));
    self.emit('quit');
  });

  app.get('/sleep', function(req, res) {
    ph.sleep();
    res.sendStatus(200);
  });

  app.get('/stop', function(req, res) {
    ph.stop();
    res.sendStatus(200);
  });

  // TODO: query parameters
  app.get('/wave', function(req, res) {
    ph.wave();
    res.sendStatus(200);
  });

  // TODO: query parameters
  app.get('/turn', function(req, res) {
    ph.turn();
    res.sendStatus(200);
  });

  // TODO: query parameters
  app.get('/walk', function(req, res) {
    ph.walk();
    res.sendStatus(200);
  });

  // TODO: query parameters
  app.get('/run', function(req, res) {
    ph.run();
    res.sendStatus(200);
  });

  // TODO: query parameters
  app.get('/row', function(req, res) {
    ph.row();
    res.sendStatus(200);
  });

  var commandServer = app.listen(COMMAND_HTTP_PORT);
}



module.exports = CommandProcessor;

console.log(util.inspect(CommandProcessor, {showHidden:true, depth:99} ));
