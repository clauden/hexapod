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

var util = require('util');
var express = require('express');
var ph;
var app;

function CommandProcessor(phoenix) {
  ph = phoenix;
  app = express();
}

CommandProcessor.prototype.run = function() {

  app.get('/wake', function(req, res) {
    this.ph.wake();
    res.sendStatus(200);
  });

  app.get('/quit', function(req, res) {
    res.sendStatus(200);
    console.log("in run, app = ", util.inspect(app));
    app.close();
  });

  app.get('/sleep', function(req, res) {
    this.ph.sleep();
    res.sendStatus(200);
  });

  app.get('/stop', function(req, res) {
    this.ph.stop();
    res.sendStatus(200);
  });

  // TODO: query parameters
  app.get('/wave', function(req, res) {
    this.ph.wave();
    res.sendStatus(200);
  });

  // TODO: query parameters
  app.get('/turn', function(req, res) {
    this.ph.turn();
    res.sendStatus(200);
  });

  // TODO: query parameters
  app.get('/walk', function(req, res) {
    this.ph.walk();
    res.sendStatus(200);
  });

  // TODO: query parameters
  app.get('/run', function(req, res) {
    this.ph.run();
    res.sendStatus(200);
  });

  // TODO: query parameters
  app.get('/row', function(req, res) {
    this.ph.row();
    res.sendStatus(200);
  });

  app.listen(COMMAND_HTTP_PORT);
}

module.exports = CommandProcessor;
