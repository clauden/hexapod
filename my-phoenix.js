/**
 * This example is used to control a Lynxmotion Phoenix hexapod
 * via an Arduino Mega and DFRobot Mega Sensor Shield
 *
 * Robot
 * http://www.lynxmotion.com/c-117-phoenix.aspx
 * http://arduino.cc/en/Main/ArduinoBoardMegaADK
 * http://www.dfrobot.com/index.php?route=product/product&path=35_124&product_id=560
 *
 * You will want to update a couple of things for your robot:
 * 1. You can tweak your walk with the "lift", "h" and "s" objects.
 * 2. You can trim your servos by changing the offset values on each servo
 *
 */
// based on git://github.com/javascript-robotics/Buck.Animation/phoenix.js


var   five = require("johnny-five"),
      // temporal = require("temporal"),
      util = require("util"),
      IOBoard = require("ioboard"),
      MaestroIOBoard = require("maestro-ioboard"),
      actions = require("./actions"),
      joints = require("./joints"),
      positions = require("./positions"),
      PololuMaestro = require("pololu-maestro");

var   board, phoenix = { state: "sleep" };

var   commandProcessor = require("./command-processor");


// FTDI Friend to Maestro TTL
// var tty = "/dev/tty.usbserial-A703X390";

// Maestro Dual Port mode on mac
// var tty = "/dev/cu.usbmodem00087311";  // micro
var tty = "/dev/cu.usbmodem00113561"      // maestro 24

var maestro = new PololuMaestro(tty, 19200);

// need to do this early
positions.setPositions();

// 
// Assign controller pins to servos, initialize leg-servo mappings, group structures
// 
// param: the 'phoenix' object (could probably be referent to 'this'?)
//
var assignServos = function() {

  // Right front leg
  phoenix.r1c = new five.Servo({pin:15, offset: 0, startAt: l.c, range: [50, 180], isInverted: true });
  phoenix.r1f = new five.Servo({pin:16, offset: 0, startAt:  l.f, range: [25, 165] });
  phoenix.r1t = new five.Servo({pin:17, offset: 0, startAt: l.t });
  phoenix.r1 = new five.Servo.Array([ phoenix.r1c, phoenix.r1f, phoenix.r1t ]);

  //Left front leg
  phoenix.l1c = new five.Servo({pin:0, offset: 0, startAt: l.c, range: [50, 180] });
  phoenix.l1f = new five.Servo({pin:1, offset: 0, startAt: l.f, range: [25, 165], isInverted: true });
  phoenix.l1t = new five.Servo({pin:2, offset: 0, startAt: l.t, isInverted: true });
  phoenix.l1 = new five.Servo.Array([ phoenix.l1c, phoenix.l1f, phoenix.l1t ]);

  //Right mid leg
  phoenix.r2c = new five.Servo({pin:9, offset: 0, startAt: l.c, range: [50, 130], isInverted: true });
  phoenix.r2f = new five.Servo({pin:10, offset: 0, startAt: l.f, range: [25, 165] });
  phoenix.r2t = new five.Servo({pin:11, offset: 0, startAt: l.t });
  phoenix.r2 = new five.Servo.Array([ phoenix.r2c, phoenix.r2f, phoenix.r2t ]);

  //Left mid leg
  phoenix.l2c = new five.Servo({pin:6, offset: 0, startAt: l.c, range: [50, 130] });
  phoenix.l2f = new five.Servo({pin:7, offset: 0, startAt: l.f, range: [25, 165], isInverted: true });
  phoenix.l2t = new five.Servo({pin:8, offset: 0, startAt: l.t, isInverted: true });
  phoenix.l2 = new five.Servo.Array([ phoenix.l2c, phoenix.l2f, phoenix.l2t ]);

  //Right rear leg
  phoenix.r3c = new five.Servo({pin:12, offset: 0, startAt: l.c, range: [50, 180]});
  phoenix.r3f = new five.Servo({pin:13, offset: 0, startAt: l.f, range: [25, 165] });
  phoenix.r3t = new five.Servo({pin:14, offset: 0, startAt: l.t });
  phoenix.r3 = new five.Servo.Array([ phoenix.r3c, phoenix.r3f, phoenix.r3t ]);

  //Left rear leg
  phoenix.l3c = new five.Servo({pin:3, offset: 0, startAt: l.c, range: [50, 180], isInverted: true });
  phoenix.l3f = new five.Servo({pin:4, offset: 0, startAt: l.f, range: [25, 165], isInverted: true });
  phoenix.l3t = new five.Servo({pin:5, offset: 0, startAt: l.t, isInverted: true });
  phoenix.l3 = new five.Servo.Array([ phoenix.l3c, phoenix.l3f, phoenix.l3t ]);

// =====
  if (false) {
    // Right front leg
    phoenix.r1c = new five.Servo({pin:0, offset: 0, startAt: l.c, range: [50, 180], isInverted: false});
    phoenix.r1f = new five.Servo({pin:1, offset: 0, startAt:  l.f, range: [25, 165] });
    phoenix.r1t = new five.Servo({pin:2, offset: 0, startAt: l.t });
    phoenix.r1 = new five.Servo.Array([ phoenix.r1c, phoenix.r1f, phoenix.r1t ]);

    // Left front leg
    phoenix.l1c = new five.Servo({pin:3, offset: 0, startAt: l.c, range: [50, 180], isInverted: true});
    phoenix.l1f = new five.Servo({pin:4, offset: 0, startAt:  l.f, range: [25, 165], isInverted: true});
    phoenix.l1t = new five.Servo({pin:5, offset: 0, startAt: l.t, isInverted: true });
    phoenix.l1 = new five.Servo.Array([ phoenix.l1c, phoenix.l1f, phoenix.l1t ]);

    //Right rear leg
    phoenix.r3c = new five.Servo({pin:6, offset: 0, startAt: l.c, range: [50, 180]});
    phoenix.r3f = new five.Servo({pin:7, offset: 0, startAt: l.f, range: [25, 165] });
    phoenix.r3t = new five.Servo({pin:8, offset: 0, startAt: l.t });
    phoenix.r3 = new five.Servo.Array([ phoenix.r3c, phoenix.r3f, phoenix.r3t ]);

    //Left rear leg
    phoenix.l3c = new five.Servo({pin:9, offset: 0, startAt: l.c, range: [50, 180], isInverted: true });
    phoenix.l3f = new five.Servo({pin:10, offset: 0, startAt: l.f, range: [25, 165], isInverted: true });
    phoenix.l3t = new five.Servo({pin:11, offset: 0, startAt: l.t, isInverted: true });
    phoenix.l3 = new five.Servo.Array([ phoenix.l3c, phoenix.l3f, phoenix.l3t ]);
  }

    // end servo assignments

}

var maestroType = PololuMaestro.TYPES.MINI_MAESTRO_24; 
// var maestroType = PololuMaestro.TYPES.MICRO_MAESTRO; 

var maestroPins = [
      IOBoard.CONSTANTS.MODES.SERVO,
      IOBoard.CONSTANTS.MODES.SERVO,
      IOBoard.CONSTANTS.MODES.SERVO,
      IOBoard.CONSTANTS.MODES.SERVO,
      IOBoard.CONSTANTS.MODES.SERVO,
      IOBoard.CONSTANTS.MODES.SERVO,
      IOBoard.CONSTANTS.MODES.SERVO,
      IOBoard.CONSTANTS.MODES.SERVO,
      IOBoard.CONSTANTS.MODES.SERVO,
      IOBoard.CONSTANTS.MODES.SERVO,
      IOBoard.CONSTANTS.MODES.SERVO,
      IOBoard.CONSTANTS.MODES.SERVO,
      IOBoard.CONSTANTS.MODES.SERVO,
      IOBoard.CONSTANTS.MODES.SERVO,
      IOBoard.CONSTANTS.MODES.SERVO,
      IOBoard.CONSTANTS.MODES.SERVO,
      IOBoard.CONSTANTS.MODES.SERVO,
      IOBoard.CONSTANTS.MODES.SERVO,
      IOBoard.CONSTANTS.MODES.SERVO,
      IOBoard.CONSTANTS.MODES.SERVO,
      IOBoard.CONSTANTS.MODES.SERVO,
      IOBoard.CONSTANTS.MODES.SERVO,
      IOBoard.CONSTANTS.MODES.SERVO,
      IOBoard.CONSTANTS.MODES.SERVO
];


var mb = new MaestroIOBoard(maestro, maestroType, maestroPins, function(br) {

    board = new five.Board({ io: br, repl: false }).on("ready", function() {

      assignServos();

      // set no-op defaults so we can add servos/legs incrementally during development
      joints.setup(phoenix);
      legsAnimation = new five.Animation(phoenix.legs);

      actions.setup(phoenix);

      // Inject the `ph` object into the Repl instance's context
      if (this.repl) {
        this.repl.inject({
          ph: phoenix,
          wr: phoenix.waveRight,
          wl: phoenix.waveLeft
          
        });
      }

      // kick off thing that listens for cmds and calls methods on phoenix
      console.log(util.inspect(commandProcessor));

      var running = true;
      var cp = new commandProcessor(phoenix);
      console.log(util.inspect(cp));

      var check_done = function() {
        console.log("check_done (", running, ")");
        if (!running) {
          console.log("see ya");
          process.exit();
        }
      }

      console.log("from main: ", util.inspect(cp.emit));
      cp.on('quit', function() {
        running = false;
      });
    
      cp.run();

      // ...and check to see if it has told us to quit recently
      setInterval(check_done, 5000);
  });
});
