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
      joints = require("./joints"),
      positions = require("./positions"),
      PololuMaestro = require("pololu-maestro");

var   board, phoenix = { state: "sleep" },
      easeIn = "inQuad",
      easeOut = "outQuad",
      easeInOut = "inOutQuad";

// FTDI Friend to Maestro TTL
// var tty = "/dev/tty.usbserial-A703X390";

// Maestro Dual Port mode on mac
var tty = "/dev/cu.usbmodem00087311";

var maestro = new PololuMaestro(tty, 19200);

positions.setPositions();

/****
  // This object describes the "leg lift" used in walking
  lift = { femur: 30, tibia: -20 },

  // This object contains the home positions of each
  // servo in its forward, mid and rear position for
  // walking.
  h = {
    f: {
      c: [56, 70, 91],
      f: [116, 120, 119],
      t: [97, 110, 116]
    },
    m: {
      c: [70, 88, 109],
      f: [116, 117, 116],
      t: [102, 106, 104]
    },
    r: {
      c: [56, 70, 91],
      f: [116, 120, 119],
      t: [97, 110, 116]
    }
  },

  // This object contains our end effector positions for turns
  t = {
    f: {
      c: [56, 70, 85 ],
      f: [121, 120, 119],
      t: [117, 110, 105]
    },
    m: {
      c: [73, 88, 105],
      f: [118, 117, 118],
      t: [107, 106, 107]
    },
    r: {
      c: [56, 70, 85 ],
      f: [121, 120, 119],
      t: [117, 110, 105]
    }
  },

  // This object contains the home positions of each
  // servo for the seven steps in walk and crawl.
  s = {
    f: {
      c: [56, 59, 65, 70, 76, 82, 91],
      f: [116, 117,119, 120, 120, 119, 119],
      t: [97, 101, 106, 110, 112, 114, 116]
    },
    m: {
      c: [70, 76, 82, 88, 94, 100, 109],
      f: [116, 119, 118, 117, 118, 117, 116],
      t: [102, 105, 106, 106, 108, 106, 104]
    },
    r: {
      c: [91, 82, 76, 70, 65, 59, 56],
      f: [119, 119,120, 120, 119, 117, 116],
      t: [116, 114, 112, 110, 106, 101, 97]
    }
  },

  // This object contains the sleep positions for our joints
  l = {
    c: 90,
    f: 165,
    t: 150
  };
****/

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

    // Leg groups

    // Joints (used in stand)
    p.femurs = new five.Servo.Array([p.r1f, p.l1f, p.r2f, p.l2f, p.r3f, p.l3f]);
    p.tibia = new five.Servo.Array([p.r1t, p.l1t, p.r2t, p.l2t, p.r3t, p.l3t]);
    p.coxa = new five.Servo.Array([p.r1c, p.l1c, p.r2c, p.l2c, p.r3c, p.l3c]);
    p.innerCoxa = new five.Servo.Array([p.r2c, p.l2c]);
    p.outerCoxa = new five.Servo.Array([p.r1c, p.l1c, p.r3c, p.l3c]);

    // Joint/leg pairs (used in row)
    p.frontCoxa = new five.Servo.Array([p.r1c, p.l1c]);
    p.frontFemur = new five.Servo.Array([p.r1f, p.l1f]);
    p.frontTibia = new five.Servo.Array([p.r1t, p.l1t]);
    p.midCoxa = new five.Servo.Array([p.r2c, p.l2c]);
    p.midFemur = new five.Servo.Array([p.r2f, p.l2f]);
    p.midTibia = new five.Servo.Array([p.r2t, p.l2t]);
    p.rearCoxa = new five.Servo.Array([p.r3c, p.l3c]);
    p.rearFemur = new five.Servo.Array([p.r3f, p.l3f]);
    p.rearTibia = new five.Servo.Array([p.r3t, p.l3t]);

    p.leftOuterCoxa = new five.Servo.Array([p.l1c, p.l3c]);
    p.rightOuterCoxa = new five.Servo.Array([p.r1c, p.r3c]);
    p.leftOuterFemur = new five.Servo.Array([p.l1f, p.l3f]);
    p.rightOuterFemur = new five.Servo.Array([p.r1f, p.r3f]);
    p.leftOuterTibia = new five.Servo.Array([p.l1t, p.l3t]);
    p.rightOuterTibia = new five.Servo.Array([p.r1t, p.r3t]);

    p.jointPairs = new five.Servo.Array([
      p.frontCoxa, p.frontFemur, p.frontTibia,
      p.midCoxa, p.midFemur, p.midTibia,
      p.rearCoxa, p.rearFemur, p.rearTibia
    ]);

    p.joints = new five.Servo.Array([p.coxa, p.femurs, p.tibia]);
    p.altJoints = new five.Servo.Array([p.innerCoxa, p.outerCoxa, p.femurs, p.tibia]);
    p.triJoints = new five.Servo.Array([p.leftOuterCoxa, p.r2c, p.leftOuterFemur, p.r2f, p.leftOuterTibia, p.r2t, p.rightOuterCoxa, p.l2c, p.rightOuterFemur, p.l2f, p.rightOuterTibia, p.l2t]);

    p.legs = new five.Servo.Array([p.r1c, p.r1f, p.r1t, p.l1c, p.l1f, p.l1t, p.r2c, p.r2f, p.r2t, p.l2c, p.l2f, p.l2t, p.r3c, p.r3f, p.r3t, p.l3c, p.l3f, p.l3t]);

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

  var xyzzy = {
    target: phoenix.r1,
    duration: 5000,
    loop: true,
    easing: "inOutQuad",
    metronomic: true,
    cuePoints: [0, 0.2, 0.4, 0.6, 0.8, 1.0],
    oncomplete: function() {
      phoenix.state = "xyzzy";
    },

    // each row is a target element
    keyFrames: [
      // cue-point-0, cue-point-1, cue-point-2, ...
      [ null, { degrees: 180}, {degrees: 150}, {degrees:120}, {degrees: 90}, {degrees: 70}, {degrees: 50}],
      [ null, { degrees: 165}, {degrees: 150}, {degrees:120}, {degrees: 90}, {degrees: 50}, {degrees: 25}],
      [ null, { degrees: 180}, {degrees: 150}, {degrees:120}, {degrees: 90}, {degrees: 50}, {degrees: 20}],
    ]
  };

  var testit = {
    duration: 500,
    cuePoints: [0, 0.5, 0.75, 1.0],
    fps: 100,
    easing: easeOut,
    target: phoenix.r1,
    oncomplete: function() {
      phoenix.state = "testit";
    },
    keyFrames: [
      [null, null, false, { degrees: l.c, easing: easeOut }],
      [null, null, false, { degrees: l.c, easing: easeOut }],
      [null, { degrees: h.f.f[1] + 20, easing: easeOut }, { degrees: l.f, easing: easeInOut }],
      // [null, false, { degrees: l.t, easing: easeInOut }]
    ]
  }


  // From stand to sleep
  var sleep = {
    duration: 500,
    cuePoints: [0, 0.5, 0.75, 1.0],
    fps: 100,
    easing: easeOut,
    target: phoenix.altJoints,
    oncomplete: function() {
      phoenix.state = "sleep";
    },
    keyFrames: [
      [null, false, false, { degrees: l.c, easing: easeOut }],
      [null, false, false, { degrees: l.c, easing: easeOut }],
      [null, { degrees: h.f.f[1] + 20, easing: easeOut }, { degrees: l.f, easing: easeInOut }],
      //  [null, false, { degrees: l.t, easing: easeInOut }]
    ]
  };

  // Wave right tibia
  var waveRight = {
    duration: 1500,
    cuePoints: [0, 0.1, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
    target: phoenix.r1,
    oncomplete: function() {
      phoenix.state = "stand";
    },
    keyFrames: [
      [null, false, { degrees: 20, easing: easeInOut }, false, false, false, false, false, false, {copyDegrees: 0, easing: easeInOut} ], // r1c
      [null, { step: 55, easing: easeInOut }, false, false, false, false, false, false, { step: -55, easing: easeInOut }, {copyDegrees: 0, easing: easeInOut} ], // r1f
      [null, { degrees: 85, easing: easeInOut }, { degrees: 45, easing: easeInOut }, { step: -15, easing: easeInOut}, { step: 30, easing: easeInOut}, { copyDegrees: 3, easing: easeInOut}, { copyFrame: 4 }, { copyDegrees: 2, easing: easeInOut}, { copyFrame: 1 }, {copyDegrees: 0, easing: easeInOut} ]
    ]
  };

  // Wave left tibia
  var waveLeft = {
    duration: 1500,
    cuePoints: [0, 0.1, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
    target: phoenix.l1,
    oncomplete: function() {
      phoenix.state = "stand";
    },
    keyFrames: [
      [null, false, { degrees: 20, easing: easeInOut }, false, false, false, false, false, { degrees: 52, easing: easeInOut }, {copyDegrees: 0, easing: easeInOut} ], // l1c
      [null, { step: 55, easing: easeInOut }, false, false, false, false, false, false, { step: -55, easing: easeInOut }, {copyDegrees: 0, easing: easeInOut} ], // l1f
      [null, { degrees: 85, easing: easeInOut }, { degrees: 45, easing: easeInOut }, { step: -15, easing: easeInOut}, { step: 30, easing: easeInOut}, { copyDegrees: 3, easing: easeInOut}, { copyFrame: 4 }, { copyDegrees: 2, easing: easeInOut}, { copyFrame: 1 }, {copyDegrees: 0, easing: easeInOut} ]
    ]
  };

  // Tripod gait
  phoenix.run = function(dir) {
    var a = dir === "rev" ? 0 : 2,
      b = dir === "rev" ? 2 : 0;

    legsAnimation.enqueue({
      duration: 1000,
      cuePoints: [0, 0.25, 0.5, 0.75, 1.0],
      loop: true,
      fps: 100,
      onstop: function() { phoenix.att(); },
      oncomplete: function() { },
      keyFrames: [
        [ null, {degrees: h.f.c[1]}, {degrees: h.f.c[a]}, null, {degrees: h.f.c[b]}],
        [ null, {degrees: h.f.f[1]}, {degrees: h.f.f[a]}, { step: lift.femur, easing: easeOut }, {degrees: h.f.f[b], easing: easeIn}],
        [ null, {degrees: h.f.t[1]}, {degrees: h.f.t[a]}, { step: lift.tibia, easing: easeOut }, {degrees: h.f.t[b], easing: easeIn}],

        [ null, null, {degrees: h.f.c[b]}, {degrees: h.f.c[1]}, {degrees: h.f.c[a]}],
        [ null, { step: lift.femur, easing: easeOut }, {degrees: h.f.f[b], easing: easeIn}, {degrees: h.f.f[1]}, {degrees: h.f.f[a]}],
        [ null, { step: lift.tibia, easing: easeOut }, {degrees: h.f.t[b], easing: easeIn}, {degrees: h.f.t[1]}, {degrees: h.f.t[a]}],

        [ null, null, {degrees: h.m.c[b]}, {degrees: h.m.c[1]}, {degrees: h.m.c[a]}],
        [ null, { step: lift.femur, easing: easeOut }, {degrees: h.m.f[b], easing: easeIn}, {degrees: h.m.f[1]}, {degrees: h.m.f[a]}],
        [ null, { step: lift.tibia, easing: easeOut }, {degrees: h.m.t[b], easing: easeIn}, {degrees: h.m.t[1]}, {degrees: h.m.t[a]}],

        [ null, {degrees: h.m.c[1]}, {degrees: h.m.c[a]}, null, {degrees: h.m.c[b]}],
        [ null, {degrees: h.m.f[1]}, {degrees: h.m.f[a]}, { step: lift.femur, easing: easeOut }, {degrees: h.m.f[b], easing: easeIn}],
        [ null, {degrees: h.m.t[1]}, {degrees: h.m.t[a]}, { step: lift.tibia, easing: easeOut }, {degrees: h.m.t[b], easing: easeIn}],

        [ null, {degrees: h.r.c[1]}, {degrees: h.r.c[b]}, null, {degrees: h.r.c[a]}],
        [ null, {degrees: h.r.f[1]}, {degrees: h.r.f[b]}, { step: lift.femur, easing: easeOut }, {degrees: h.r.f[a], easing: easeIn}],
        [ null, {degrees: h.r.t[1]}, {degrees: h.r.t[b]}, { step: lift.tibia, easing: easeOut }, {degrees: h.r.t[a], easing: easeIn}],

        [ null, null, {degrees: h.r.c[a]}, {degrees: h.r.c[1]}, {degrees: h.r.c[b]}],
        [ null, { step: lift.femur, easing: easeOut }, {degrees: h.r.f[a], easing: easeIn}, {degrees: h.r.f[1]}, {degrees: h.r.f[b]}],
        [ null, { step: lift.tibia, easing: easeOut }, {degrees: h.r.t[a], easing: easeIn}, {degrees: h.r.t[1]}, {degrees: h.r.t[b]}],
      ]
    });
    return this;
  };

  // Two leg gait
  var walk = {
    duration: 2000,
    cuePoints: [0, 0.071, 0.143, 0.214, 0.286, 0.357, 0.429, 0.5, 0.571, 0.643, 0.714, 0.786, 0.857, 0.929, 1],
    loop: true,
    loopback: 0.5,
    fps: 100,
    onstop: function() { phoenix.att(); },
    oncomplete: function() { },
    keyFrames: [
      [null, null, {degrees: s.f.c[5]}, null, null, null, null, {degrees: s.f.c[5]}, null, {degrees: s.f.c[0]}, null, null, null, null, {degrees: s.f.c[5]}], // r1c
      [null, { step: lift.femur, easing: easeOut }, {degrees: s.f.f[5], easing: easeIn}, null, null, null, null, {degrees: s.f.f[5]}, { step: lift.femur, easing: easeOut }, {degrees: s.f.f[0], easing: easeIn}, null, null, null, null, {degrees: s.f.f[5]}],
      [null, { step: lift.tibia, easing: easeOut }, {degrees: s.f.t[5], easing: easeIn}, null, null, null, null, {degrees: s.f.t[5]}, { step: lift.tibia, easing: easeOut }, {degrees: s.f.t[0], easing: easeIn}, null, null, null, null, {degrees: s.f.t[5]}],

      [null, null, null, false, null, {degrees: s.f.c[2]}, null, {degrees: s.f.c[2]}, null, null, {degrees: s.f.c[5]}, null, {degrees: s.f.c[0]}, null, {degrees: s.f.c[2]}],
      [null, null, null, false, { step: lift.femur, easing: easeOut }, {degrees: s.f.f[2], easing: easeIn}, null, {degrees: s.f.f[2]}, null, null, {degrees: s.f.f[5]}, { step: lift.femur, easing: easeOut }, {degrees: s.f.f[0], easing: easeIn}, null, {degrees: s.f.f[2]}],
      [null, null, null, false, { step: lift.tibia, easing: easeOut }, {degrees: s.f.t[2], easing: easeIn}, null, {degrees: s.f.t[2]}, null, null, {degrees: s.f.t[5]}, { step: lift.tibia, easing: easeOut }, {degrees: s.f.t[0], easing: easeIn}, null, {degrees: s.f.t[2]}],

      [null, null, null, null, false, null, {degrees: s.m.c[1]}, {degrees: s.m.c[1]}, null, null, null, {degrees: s.m.c[5]}, null, {degrees: s.m.c[0]}, {degrees: s.m.c[1]}],
      [null, null, null, null, false, { step: lift.femur, easing: easeOut }, {degrees: s.m.f[1], easing: easeIn}, {degrees: s.m.f[1]}, null, null, null, {degrees: s.m.f[5]}, { step: lift.femur, easing: easeOut }, {degrees: s.m.f[0], easing: easeIn}, {degrees: s.m.f[1]}],
      [null, null, null, null, false, { step: lift.tibia, easing: easeOut }, {degrees: s.m.t[1], easing: easeIn}, {degrees: s.m.t[1]}, null, null, null, {degrees: s.m.t[5]}, { step: lift.tibia, easing: easeOut }, {degrees: s.m.t[0], easing: easeIn}, {degrees: s.m.t[1]}],

      [null, false, null, {degrees: s.m.c[4]}, null, null, null, {degrees: s.m.c[4]}, {degrees: s.m.c[5]}, null, {degrees: s.m.c[0]}, null, null, null, {degrees: s.m.c[4]}],
      [null, false, { step: lift.femur, easing: easeOut }, {degrees: s.m.f[4], easing: easeIn}, null, null, null, {degrees: s.m.f[4]}, {degrees: s.m.f[5]}, { step: lift.femur, easing: easeOut }, {degrees: s.m.f[0], easing: easeIn}, null, null, null, {degrees: s.m.f[4]}],
      [null, false, { step: lift.tibia, easing: easeOut }, {degrees: s.m.t[4], easing: easeIn}, null, null, null, {degrees: s.m.t[4]}, {degrees: s.m.t[5]}, { step: lift.tibia, easing: easeOut }, {degrees: s.m.t[0], easing: easeIn}, null, null, null, {degrees: s.m.t[4]}],

      [null, null, false, null, {degrees: s.r.c[3]}, null, null, {degrees: s.r.c[3]}, null, {degrees: s.r.c[5]}, null, {degrees: s.r.c[0]}, {degrees: s.r.c[1]}, null, {degrees: s.r.c[3]}],
      [null, null, false, { step: lift.femur, easing: easeOut }, {degrees: s.r.f[3], easing: easeIn}, null, null, {degrees: s.r.f[3]}, null, {degrees: s.r.f[5]}, { step: lift.femur, easing: easeOut }, {degrees: s.r.f[0], easing: easeIn}, {degrees: s.r.f[1]}, null, {degrees: s.r.f[3]}],
      [null, null, false, { step: lift.tibia, easing: easeOut }, {degrees: s.r.t[3], easing: easeIn}, null, null, {degrees: s.r.t[3]}, null, {degrees: s.r.t[5]}, { step: lift.tibia, easing: easeOut }, {degrees: s.r.t[0], easing: easeIn}, {degrees: s.r.t[1]}, null, {degrees: s.r.t[3]}],

      [null, null, null, null, null, false, null, {degrees: s.r.c[0]}, null, null, null, null, {degrees: s.r.c[5]}, null, {degrees: s.r.c[0]}],
      [null, null, null, null, null, false, { step: lift.femur, easing: easeOut }, {degrees: s.r.f[0], easing: easeIn}, null, null, null, null, {degrees: s.r.f[5]}, { step: lift.femur, easing: easeOut }, {degrees: s.r.f[0], easing: easeIn}],
      [null, null, null, null, null, false, { step: lift.tibia, easing: easeOut }, {degrees: s.r.t[0], easing: easeIn}, null, null, null, null, {degrees: s.r.t[5]}, { step: lift.tibia, easing: easeOut }, {degrees: s.r.t[0], easing: easeIn}]
    ]
  };

  // One leg gait
  var crawl = {
    duration: 2000,
    cuePoints: [0, 0.071, 0.143, 0.214, 0.286, 0.357, 0.429, 0.5, 0.542, 0.583, 0.625, 0.667, 0.708, 0.75, 0.792, 0.833, 0.875, 0.917, 0.958, 1],
    loop: true,
    loopback: 0.5,
    fps: 100,
    onstop: function() { phoenix.att(); },
    oncomplete: function() { },
    keyFrames: [
      [null, null, {degrees: s.f.c[5]}, null, null, null, null, {degrees: s.f.c[5]}, null, {degrees: s.f.c[0]}, null, null, null, null, null, null, null, null, null, {degrees: s.f.c[5]}],
      [null, { step: lift.femur, easing: easeOut }, {degrees: s.f.f[5], easing: easeIn}, null, null, null, null, {degrees: s.f.f[5]}, { step: lift.femur, easing: easeOut }, {degrees: s.f.f[0], easing: easeIn}, null, null, null, null, null, null, null, null, null, {degrees: s.f.f[5]}],
      [null, { step: lift.tibia, easing: easeOut }, {degrees: s.f.t[5], easing: easeIn}, null, null, null, null, {degrees: s.f.t[5]}, { step: lift.tibia, easing: easeOut }, {degrees: s.f.t[0], easing: easeIn}, null, null, null, null, null, null, null, null, null, {degrees: s.f.t[5]}],

      [null, null, null, false, null, {degrees: s.f.c[2]}, null, {degrees: s.f.c[2]}, null, null, null, null, null, {degrees: s.f.c[5]}, null, {degrees: s.f.c[0]}, null, null, null, {degrees: s.f.c[2]}],
      [null, null, null, false, { step: lift.femur, easing: easeOut }, {degrees: s.f.f[2], easing: easeIn}, null, {degrees: s.f.f[2]}, null, null, null, null, null, {degrees: s.f.f[5]}, { step: lift.femur, easing: easeOut }, {degrees: s.f.f[0], easing: easeIn}, null, null, null, {degrees: s.f.f[2]}],
      [null, null, null, false, { step: lift.tibia, easing: easeOut }, {degrees: s.f.t[2], easing: easeIn}, null, {degrees: s.f.t[2]}, null, null, null, null, null, {degrees: s.f.t[5]}, { step: lift.tibia, easing: easeOut }, {degrees: s.f.t[0], easing: easeIn}, null, null, null, {degrees: s.f.t[2]}],

      [null, null, null, null, false, null, {degrees: s.m.c[1]}, {degrees: s.m.c[1]}, null, null, null, null, null, null, null, {degrees: s.m.c[5]}, null, {degrees: s.m.c[0]}, null, {degrees: s.m.c[1]}],
      [null, null, null, null, false, { step: lift.femur, easing: easeOut }, {degrees: s.m.f[1], easing: easeIn}, {degrees: s.m.f[1]}, null, null, null, null, null, null, null, {degrees: s.m.f[5]}, { step: lift.femur, easing: easeOut }, {degrees: s.m.f[0], easing: easeIn}, null, {degrees: s.m.f[1]}],
      [null, null, null, null, false, { step: lift.tibia, easing: easeOut }, {degrees: s.m.t[1], easing: easeIn}, {degrees: s.m.t[1]}, null, null, null, null, null, null, null, {degrees: s.m.t[5]}, { step: lift.tibia, easing: easeOut }, {degrees: s.m.t[0], easing: easeIn}, null, {degrees: s.m.t[1]}],

      [null, false, null, {degrees: s.m.c[4]}, null, null, null, {degrees: s.m.c[4]}, null, {degrees: s.m.c[5]}, null, {degrees: s.m.c[0]}, null, null, null, null, null, null, null, {degrees: s.m.c[4]}],
      [null, false, { step: lift.femur, easing: easeOut }, {degrees: s.m.f[4], easing: easeIn}, null, null, null, {degrees: s.m.f[4]}, null, {degrees: s.m.f[5]}, { step: lift.femur, easing: easeOut }, {degrees: s.m.f[0], easing: easeIn}, null, null, null, null, null, null, null, {degrees: s.m.f[4]}],
      [null, false, { step: lift.tibia, easing: easeOut }, {degrees: s.m.t[4], easing: easeIn}, null, null, null, {degrees: s.m.t[4]}, null, {degrees: s.m.t[5]}, { step: lift.tibia, easing: easeOut }, {degrees: s.m.t[0], easing: easeIn}, null, null, null, null, null, null, null, {degrees: s.m.t[4]}],

      [null, null, false, null, {degrees: s.r.c[3]}, null, null, {degrees: s.r.c[3]}, null, null, null, {degrees: s.r.c[5]}, null, {degrees: s.r.c[0]}, null, null, null, null, null, {degrees: s.r.c[3]}],
      [null, null, false, { step: lift.femur, easing: easeOut }, {degrees: s.r.f[3], easing: easeIn}, null, null, {degrees: s.r.f[3]}, null, null, null, {degrees: s.r.f[5]}, { step: lift.femur, easing: easeOut }, {degrees: s.r.f[0], easing: easeIn}, null, null, null, null, null, {degrees: s.r.f[3]}],
      [null, null, false, { step: lift.tibia, easing: easeOut }, {degrees: s.r.t[3], easing: easeIn}, null, null, {degrees: s.r.t[3]}, null, null, null, {degrees: s.r.t[5]}, { step: lift.tibia, easing: easeOut }, {degrees: s.r.t[0], easing: easeIn}, null, null, null, null, null, {degrees: s.r.t[3]}],

      [null, null, null, null, null, false, null, {degrees: s.r.c[0]}, null, null, null, null, null, null, null, null, null, {degrees: s.r.c[5]}, null, {degrees: s.r.c[0]}],
      [null, null, null, null, null, false, { step: lift.femur, easing: easeOut }, {degrees: s.r.f[0], easing: easeIn}, null, null, null, null, null, null, null, null, null, {degrees: s.r.f[5]}, { step: lift.femur, easing: easeOut }, {degrees: s.r.f[0], easing: easeIn}],
      [null, null, null, null, null, false, { step: lift.tibia, easing: easeOut }, {degrees: s.r.t[0], easing: easeIn}, null, null, null, null, null, null, null, null, null, {degrees: s.r.t[5]}, { step: lift.tibia, easing: easeOut }, {degrees: s.r.t[0], easing: easeIn}]
    ]
  };

  // Wave gait
  phoenix.row = function(dir) {
    var a = dir === "rev" ? 2 : 0,
      b = dir === "rev" ? 0 : 2;

    legsAnimation.enqueue({
      target: phoenix.jointPairs,
      duration: 1500,
      cuePoints: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.85, 1.0],
      loop: true,
      fps: 100,
      onstop: function() { phoenix.att(); },
      oncomplete: function() { },
      keyFrames: [

        [null, null, null, null, false, null, {degrees: h.f.c[a]}, false, {degrees: h.f.c[1]}, {degrees: h.f.c[b]}],
        [null, null, null, null, false, { step: lift.femur, easing: easeOut }, {degrees: h.f.f[a]}, false, {degrees: h.f.f[1]}, {degrees: h.f.f[b]}],
        [null, null, null, null, false, { step: lift.tibia, easing: easeOut }, {degrees: h.f.t[a]}, false, {degrees: h.f.t[1]}, {degrees: h.f.t[b]}],

        [null, null, false, null, {degrees: h.m.c[a]}, null, null, false, {degrees: h.m.c[1]}, {degrees: h.m.c[b]}],
        [null, null, false, { step: lift.femur, easing: easeOut }, {degrees: h.m.f[a]}, null, null, false, {degrees: h.m.f[1]}, {degrees: h.m.f[b]}],
        [null, null, false, { step: lift.tibia, easing: easeOut }, {degrees: h.m.t[a]}, null, null, false, {degrees: h.m.t[1]}, {degrees: h.m.t[b]}],

        [null, null, {degrees: h.r.c[b]}, null, null, null, null, false, {degrees: h.r.c[1]}, {degrees: h.r.c[a]}],
        [null, { step: lift.femur, easing: easeOut },  {degrees: h.r.f[b]}, null, null, null, null, false, {degrees: h.r.f[1]}, {degrees: h.r.f[a]}],
        [null, { step: lift.tibia, easing: easeOut }, {degrees: h.r.t[b]}, null, null, null, null, false, {degrees: h.r.t[1]}, {degrees: h.r.t[a]}],

      ]
    });
    return this;
  };

  // Show gait with COG outside of polygon formed by legs
  phoenix.badRow = function(dir) {
    var a = dir === "rev" ? 2 : 0,
      b = dir === "rev" ? 0 : 2;

    legsAnimation.enqueue({
      target: phoenix.jointPairs,
      duration: 1500,
      cuePoints: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.85, 1.0],
      loop: true,
      fps: 100,
      onstop: function() { phoenix.att(); },
      oncomplete: function() { },
      keyFrames: [
        [null, null, {degrees: h.f.c[a]}, null, null, null, null, false, {degrees: h.f.c[1]}, {degrees: h.f.c[b]}],
        [null, { step: lift.femur, easing: easeOut },  {degrees: h.f.f[a]}, null, null, null, null, false, {degrees: h.f.f[1]}, {degrees: h.f.f[b]}],
        [null, { step: lift.tibia, easing: easeOut }, {degrees: h.f.t[a]}, null, null, null, null, false, {degrees: h.f.t[1]}, {degrees: h.f.t[b]}],

        [null, null, false, null, {degrees: h.m.c[a]}, null, null, false, {degrees: h.m.c[1]}, {degrees: h.m.c[b]}],
        [null, null, false, { step: lift.femur, easing: easeOut }, {degrees: h.m.f[a]}, null, null, false, {degrees: h.m.f[1]}, {degrees: h.m.f[b]}],
        [null, null, false, { step: lift.tibia, easing: easeOut }, {degrees: h.m.t[a]}, null, null, false, {degrees: h.m.t[1]}, {degrees: h.m.t[b]}],

        [null, null, null, null, false, null, {degrees: h.r.c[b]}, false, {degrees: h.r.c[1]}, {degrees: h.r.c[a]}],
        [null, null, null, null, false, { step: lift.femur, easing: easeOut }, {degrees: h.r.f[b]}, false, {degrees: h.r.f[1]}, {degrees: h.r.f[a]}],
        [null, null, null, null, false, { step: lift.tibia, easing: easeOut }, {degrees: h.r.t[b]}, false, {degrees: h.r.t[1]}, {degrees: h.r.t[a]}],
      ]
    });
    return this;
  };

  // Tripod turn
  phoenix.turn = function(dir) {
    var a = dir === "left" ? 2 : 0,
      b = dir === "left" ? 0 : 2;

    legsAnimation.enqueue({
      duration: 1500,
      fps: 100,
      cuePoints: [0, 0.25, 0.5, 0.625, 0.75, 0.875, 1.0],
      loop: true,
      loopback: 0.5,
      onstop: function() { phoenix.att(); },
      keyFrames: [
        [ null, null, {degrees: t.f.c[a]}, null, {degrees: t.f.c[b]}, null, {degrees: t.f.c[a]}],
        [ null, null, {degrees: t.f.f[a]}, { step: lift.femur, easing: easeOut }, {degrees: t.f.f[b]}, null, {degrees: t.f.f[a]}],
        [ null, null, {degrees: t.f.t[a]}, { step: lift.tibia, easing: easeOut }, {degrees: t.f.t[b]}, null, {degrees: t.f.t[a]}],

        [ null, null, {degrees: t.f.c[a]}, null, {degrees: t.f.c[b]}, null, {degrees: t.f.c[a]}],
        [ null, { step: lift.femur, easing: easeOut }, {degrees: t.f.f[a], easing: easeIn}, null, {degrees: t.f.f[b], easing: easeIn}, { step: lift.femur, easing: easeOut }, {degrees: t.f.f[a], easing: easeIn}],
        [ null, { step: lift.tibia, easing: easeOut }, {degrees: t.f.t[a], easing: easeIn}, null, {degrees: t.f.t[b], easing: easeIn}, { step: lift.tibia, easing: easeOut }, {degrees: t.f.t[a], easing: easeIn}],

        [ null, null, {degrees: t.m.c[b]}, null, {degrees: t.m.c[a]}, null, {degrees: t.m.c[b]}],
        [ null, { step: lift.femur, easing: easeOut }, {degrees: t.m.f[b], easing: easeIn}, null, {degrees: t.m.f[a], easing: easeIn}, { step: lift.femur, easing: easeOut }, {degrees: t.m.f[b], easing: easeIn}],
        [ null, { step: lift.tibia, easing: easeOut }, {degrees: t.m.t[b], easing: easeIn}, null, {degrees: t.m.t[a], easing: easeIn}, { step: lift.tibia, easing: easeOut }, {degrees: t.m.t[b], easing: easeIn}],

        [ null, null, {degrees: t.m.c[b]}, null, {degrees: t.m.c[a]}, null, {degrees: t.m.c[b]}],
        [ null, null, {degrees: t.m.f[b]}, { step: lift.femur, easing: easeOut }, {degrees: t.m.f[a]}, null, {degrees: t.m.f[b]}],
        [ null, null, {degrees: t.m.t[b]}, { step: lift.tibia, easing: easeOut }, {degrees: t.m.t[a]}, null, {degrees: t.m.t[b]}],

        [ null, null, {degrees: t.r.c[b]}, null, {degrees: t.r.c[a]}, null, {degrees: t.r.c[b]}],
        [ null, null, {degrees: t.r.f[b]}, { step: lift.femur, easing: easeOut }, {degrees: t.r.f[a]}, null, {degrees: t.r.f[b]}],
        [ null, null, {degrees: t.r.t[b]}, { step: lift.tibia, easing: easeOut }, {degrees: t.r.t[a]}, null, {degrees: t.r.t[b]}],

        [ null, null, {degrees: t.r.c[b]}, null, {degrees: t.r.c[a]}, null, {degrees: t.r.c[b]}],
        [ null, { step: lift.femur, easing: easeOut }, {degrees: t.r.f[b], easing: easeIn}, null, {degrees: t.r.f[a], easing: easeIn}, { step: lift.femur, easing: easeOut }, {degrees: t.r.f[b], easing: easeIn}],
        [ null, { step: lift.tibia, easing: easeOut }, {degrees: t.r.t[b], easing: easeIn}, null, {degrees: t.r.t[a], easing: easeIn}, { step: lift.tibia, easing: easeOut }, {degrees: t.r.t[b], easing: easeIn}]
      ]
    });

    return this;

  };

  // Return phoenix to home position
  phoenix.att = function() {
    var most = 0, grouped, mostIndex, ani, work = [
      { name: "r1", offset: 0, home: h.f.f[1], thome: h.f.t[1], chome: h.f.c[1]},
      { name: "r2", offset: 0, home: h.m.f[1], thome: h.m.t[1], chome: h.m.c[1] },
      { name: "r3", offset: 0, home: h.r.f[1], thome: h.r.t[1], chome: h.r.c[1] },
      { name: "l1", offset: 0, home: h.f.f[1], thome: h.f.t[1], chome: h.f.c[1] },
      { name: "l2", offset: 0, home: h.m.f[1], thome: h.m.t[1], chome: h.m.c[1] },
      { name: "l3", offset: 0, home: h.r.f[1], thome: h.r.t[1], chome: h.r.c[1] }
    ];

    // Loop through legs and find how far each is from "home"
    work.forEach(function(leg, i) {
      work[i].offset = Math.abs(phoenix[leg.name+"f"].last.reqDegrees - leg.home);
    });

    var moving = _.max(work, function(leg){ return leg.offset; });

    if (moving.name === "r2" || moving.name === "l1" || moving.name === "l3") {
      grouped = [ [1, 3, 5], [0, 2, 4] ];
    } else {
      grouped = [ [0, 2, 4], [1, 3, 5] ];
    }

    grouped.forEach(function(group, i) {
      group.forEach(function(leg, j) {
        temporal.queue([
          {
            delay: 500*i,
            task: function() {
              phoenix[work[leg].name+"f"].to(work[leg].home + lift.femur);
              phoenix[work[leg].name+"t"].to(work[leg].thome + lift.tibia);
            }
          },
          {
            delay: 100,
            task: function() {
              phoenix[work[leg].name+"c"].to(work[leg].chome);
            }
          },
          {
            delay: 100,
            task: function() {
              phoenix[work[leg].name+"f"].to(work[leg].home);
              phoenix[work[leg].name+"t"].to(work[leg].thome);
            }
          }
        ]);
      });
    });
    phoenix.state = "stand";
  };

  phoenix.sleep = function() {
    legsAnimation.enqueue(sleep);
  };

  phoenix.walk = function() {
    legsAnimation.enqueue(walk);
  };

  phoenix.crawl = function() {
    legsAnimation.enqueue(crawl);
  };

  phoenix.w= function() {
    legsAnimation.enqueue(waveLeft);
  };

  phoenix.waveRight = function() {
    legsAnimation.enqueue(waveRight);
  };

  phoenix.stand = function() {
    legsAnimation.enqueue(stand);
  };

  phoenix.testit= function() {
    legsAnimation.enqueue(testit);
  };

  phoenix.xyzzy= function() {
    legsAnimation.enqueue(xyzzy);
  };

  phoenix.stop = function() {
    legsAnimation.stop();
  };

  // Inject the `ph` object into
  // the Repl instance's context
  // allows direct command line access
  this.repl.inject({
     ph: phoenix
  });

});
});
