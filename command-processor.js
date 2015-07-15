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
var eventEmitter = require('events').EventEmitter;
var express = require('express');
var url = require('url');

var ph;

CommandProcessor = function(phoenix) {
  eventEmitter.call(this);
  ph = phoenix;
}

util.inherits(CommandProcessor, eventEmitter);


var validateRL = function(dir) {
  return /^right$/.test(dir) || /^left$/.test(dir);
}

var validateFR = function(dir) {
  return /^fwd$/.test(dir) || /^rev$/.test(dir);
}

CommandProcessor.prototype.run = function() {

  var self = this;
  var params;
  var app = express();
  var router = express.Router();
  var direction;

  // first thing to be called on every request
  router.use(function(req, res, next) {
    console.log("Called me");

    params = url.parse(req.url, true).query; 
    direction = params.dir || '';

    // chain to next route handler
    next();
  });

  router.get('/wake', function(req, res) {
    ph.stand();
    res.sendStatus(200);
  });

  router.get('/quit', function(req, res) {
    res.sendStatus(200);
    commandServer.close();
    console.log("from CommandProcessor: ", util.inspect(self.emit));
    self.emit('quit');
  });

  router.get('/sleep', function(req, res) {
    ph.sleep();
    res.sendStatus(200);
  });

  router.get('/stop', function(req, res) {
    ph.stop();
    res.sendStatus(200);
  });

  // TODO: semantics, query parameters
  router.get('/wave', function(req, res) {
    ph.wave();
    res.sendStatus(200);
  });

  // dir=left|right
  router.get('/turn', function(req, res) {
    if (!validateRL(direction)) {
      res.status(500).json({ error: 'direction must be right or left' });
    } else {
      ph.turn(direction);
      res.sendStatus(200);
    }
  });

  // dir ignored for now
  router.get('/walk', function(req, res) {
    ph.walk();
    res.sendStatus(200);
  });

  // dir=[fwd|rev]
  router.get('/run', function(req, res) {
    if (!validateFR(direction)) {
      res.status(500).json({ error: 'direction must be fwd or rev' });
    } else {
      ph.run(direction);
      res.sendStatus(200);
    }
  });

  // dir=[fwd|rev]
  router.get('/row', function(req, res) {
    if (!validateFR(direction)) {
      res.status(500).json({ error: 'direction must be fwd or rev' });
    } else {
      ph.row(direction);
      res.sendStatus(200);
    }
  });


  // /joint?r1c=30&r2f=120&l2t=100&...
  router.get('/joint', function(req, res) {
    var that = this;

    for (p in params) {
      if (/^[rl][1-3][cft]$/.test(p))
        console.log("This is \'", p, "\' =  \'", params[p], "\'");
        var s = 'ph.' + p + '.to(' + params[p] + ')';
        console.log(s);

        eval(s);

        // ph[p].to.call(null, params[p]);
    }
    res.sendStatus(200);
  });

  router.get('/test', function(req, res) {
    console.log("Test: ", Object.prototype.toString.call(ph['r1c'].to));
    console.log("Test: ", Object.prototype.toString.call(ph.r1c.to));
    res.sendStatus(200);
  });

  app.use('/', router);
  var commandServer = app.listen(COMMAND_HTTP_PORT);
}



module.exports = CommandProcessor;

console.log(util.inspect(CommandProcessor, {showHidden:true, depth:99} ));
