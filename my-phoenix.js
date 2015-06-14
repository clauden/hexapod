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
      temporal = require("temporal"),
      util = require("util"),
      IOBoard = require("ioboard"),
      MaestroIOBoard = require("maestro-ioboard"),
      actions = require("./actions"),
      joints = require("./joints"),
      positions = require("./positions"),
      PololuMaestro = require("pololu-maestro");

var   board, phoenix = { state: "sleep" };

      easeIn = "inQuad",
      easeOut = "outQuad",
      easeInOut = "inOutQuad";

// FTDI Friend to Maestro TTL
// var tty = "/dev/tty.usbserial-A703X390";

// Maestro Dual Port mode on mac
var tty = "/dev/cu.usbmodem00087311";

var maestro = new PololuMaestro(tty, 19200);

// need to do this early
positions.setPositions();

// 
// Assign controller pins to servos, initialize leg-servo mappings, group structures
// 
// param: the 'phoenix' object (could probably be referent to 'this'?)
//
var setupLegs = function(p) {

    // set no-op defaults so we can add servos/legs incrementally during development
    joints.setupJoints(p);

    // Servo pin assignments (override any defaults)

    // Right front leg
    p.r1c = new five.Servo({pin:0, offset: 0, startAt: l.c, range: [50, 180], isInverted: true });
    p.r1f = new five.Servo({pin:1, offset: 0, startAt:  l.f, range: [25, 165] });
    p.r1t = new five.Servo({pin:2, offset: 0, startAt: l.t });
    p.r1 = new five.Servo.Array([ p.r1c, p.r1f, p.r1t ]);

    // Left front leg
    p.l1c = new five.Servo({pin:3, offset: 0, startAt: l.c, range: [50, 180], isInverted: false});
    p.l1f = new five.Servo({pin:4, offset: 0, startAt:  l.f, range: [25, 165] });
    p.l1t = new five.Servo({pin:5, offset: 0, startAt: l.t });
    p.l1 = new five.Servo.Array([ p.l1c, p.l1f, p.l1t ]);

    // end servo assignments

}


var mb = new MaestroIOBoard(maestro, PololuMaestro.TYPES.MICRO_MAESTRO, [
      IOBoard.CONSTANTS.MODES.SERVO,
      IOBoard.CONSTANTS.MODES.SERVO,
      IOBoard.CONSTANTS.MODES.SERVO,
      IOBoard.CONSTANTS.MODES.SERVO,
      IOBoard.CONSTANTS.MODES.SERVO,
      IOBoard.CONSTANTS.MODES.SERVO
  ], function(br) {
    // console.log("maestroIOBoard callsback: " + util.inspect(br));

    // var board = new five.Board({ io: br });
    board = new five.Board({ io: br }).on("ready", function() {
      
      setupLegs(phoenix);
      legsAnimation = new five.Animation(phoenix.legs);

      actions(phoenix);


  // Inject the `ph` object into the Repl instance's context
  this.repl.inject({
     ph: phoenix
  });

});
});
