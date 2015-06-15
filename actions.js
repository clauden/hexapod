//
// declare actions and their associated animations
//

require('underscore');
var temporal = require('temporal');

var setActions = function(phoenix) {

  var easeIn = "inQuad",
      easeOut = "outQuad",
      easeInOut = "inOutQuad";

  legsAnimation = new require('johnny-five').Animation(phoenix.legs);

  // Return to home position
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

  // From sleep to stand
  var stand = {
    target: phoenix.altJoints,
    duration: 500,
    loop: false,
    fps: 100,
    cuePoints: [0, 0.1, 0.3, 0.7, 1.0],
    oncomplete: function() {
      phoenix.state = "stand";
    },
    keyFrames: [
      [null, false, { degrees: h.m.c[1] }],
      [null, false, { degrees: h.f.c[1] }],
      [null, false, false, { degrees: h.f.f[1] + 20, easing: easeOut}, { degrees: h.f.f[1], easing: easeIn}],
      [null, { degrees: h.f.t[1]}, false, { degrees: h.f.t[1] }]
    ]
  };

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
      [null, false, { degrees: l.t, easing: easeInOut }]
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
        [ null, {degrees: h.f.c[1]}, {degrees: h.f.c[a]}, false, {degrees: h.f.c[b]}],
        [ null, {degrees: h.f.f[1]}, {degrees: h.f.f[a]}, { step: lift.femur, easing: easeOut }, {degrees: h.f.f[b], easing: easeIn}],
        [ null, {degrees: h.f.t[1]}, {degrees: h.f.t[a]}, { step: lift.tibia, easing: easeOut }, {degrees: h.f.t[b], easing: easeIn}],

        [ null, false, {degrees: h.f.c[b]}, {degrees: h.f.c[1]}, {degrees: h.f.c[a]}],
        [ null, { step: lift.femur, easing: easeOut }, {degrees: h.f.f[b], easing: easeIn}, {degrees: h.f.f[1]}, {degrees: h.f.f[a]}],
        [ null, { step: lift.tibia, easing: easeOut }, {degrees: h.f.t[b], easing: easeIn}, {degrees: h.f.t[1]}, {degrees: h.f.t[a]}],

        [ null, false, {degrees: h.m.c[b]}, {degrees: h.m.c[1]}, {degrees: h.m.c[a]}],
        [ null, { step: lift.femur, easing: easeOut }, {degrees: h.m.f[b], easing: easeIn}, {degrees: h.m.f[1]}, {degrees: h.m.f[a]}],
        [ null, { step: lift.tibia, easing: easeOut }, {degrees: h.m.t[b], easing: easeIn}, {degrees: h.m.t[1]}, {degrees: h.m.t[a]}],

        [ null, {degrees: h.m.c[1]}, {degrees: h.m.c[a]}, false, {degrees: h.m.c[b]}],
        [ null, {degrees: h.m.f[1]}, {degrees: h.m.f[a]}, { step: lift.femur, easing: easeOut }, {degrees: h.m.f[b], easing: easeIn}],
        [ null, {degrees: h.m.t[1]}, {degrees: h.m.t[a]}, { step: lift.tibia, easing: easeOut }, {degrees: h.m.t[b], easing: easeIn}],

        [ null, {degrees: h.r.c[1]}, {degrees: h.r.c[b]}, false, {degrees: h.r.c[a]}],
        [ null, {degrees: h.r.f[1]}, {degrees: h.r.f[b]}, { step: lift.femur, easing: easeOut }, {degrees: h.r.f[a], easing: easeIn}],
        [ null, {degrees: h.r.t[1]}, {degrees: h.r.t[b]}, { step: lift.tibia, easing: easeOut }, {degrees: h.r.t[a], easing: easeIn}],

        [ null, false, {degrees: h.r.c[a]}, {degrees: h.r.c[1]}, {degrees: h.r.c[b]}],
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
      [null, false, {degrees: s.f.c[5]}, false, false, false, false, {degrees: s.f.c[5]}, false, {degrees: s.f.c[0]}, false, false, false, false, {degrees: s.f.c[5]}], // r1c
      [null, { step: lift.femur, easing: easeOut }, {degrees: s.f.f[5], easing: easeIn}, false, false, false, false, {degrees: s.f.f[5]}, { step: lift.femur, easing: easeOut }, {degrees: s.f.f[0], easing: easeIn}, false, false, false, false, {degrees: s.f.f[5]}],
      [null, { step: lift.tibia, easing: easeOut }, {degrees: s.f.t[5], easing: easeIn}, false, false, false, false, {degrees: s.f.t[5]}, { step: lift.tibia, easing: easeOut }, {degrees: s.f.t[0], easing: easeIn}, false, false, false, false, {degrees: s.f.t[5]}],

      [null, false, false, false, false, {degrees: s.f.c[2]}, false, {degrees: s.f.c[2]}, false, false, {degrees: s.f.c[5]}, false, {degrees: s.f.c[0]}, false, {degrees: s.f.c[2]}],
      [null, false, false, false, { step: lift.femur, easing: easeOut }, {degrees: s.f.f[2], easing: easeIn}, false, {degrees: s.f.f[2]}, false, false, {degrees: s.f.f[5]}, { step: lift.femur, easing: easeOut }, {degrees: s.f.f[0], easing: easeIn}, false, {degrees: s.f.f[2]}],
      [null, false, false, false, { step: lift.tibia, easing: easeOut }, {degrees: s.f.t[2], easing: easeIn}, false, {degrees: s.f.t[2]}, false, false, {degrees: s.f.t[5]}, { step: lift.tibia, easing: easeOut }, {degrees: s.f.t[0], easing: easeIn}, false, {degrees: s.f.t[2]}],

      [null, false, false, false, false, false, {degrees: s.m.c[1]}, {degrees: s.m.c[1]}, false, false, false, {degrees: s.m.c[5]}, false, {degrees: s.m.c[0]}, {degrees: s.m.c[1]}],
      [null, false, false, false, false, { step: lift.femur, easing: easeOut }, {degrees: s.m.f[1], easing: easeIn}, {degrees: s.m.f[1]}, false, false, false, {degrees: s.m.f[5]}, { step: lift.femur, easing: easeOut }, {degrees: s.m.f[0], easing: easeIn}, {degrees: s.m.f[1]}],
      [null, false, false, false, false, { step: lift.tibia, easing: easeOut }, {degrees: s.m.t[1], easing: easeIn}, {degrees: s.m.t[1]}, false, false, false, {degrees: s.m.t[5]}, { step: lift.tibia, easing: easeOut }, {degrees: s.m.t[0], easing: easeIn}, {degrees: s.m.t[1]}],

      [null, false, false, {degrees: s.m.c[4]}, false, false, false, {degrees: s.m.c[4]}, {degrees: s.m.c[5]}, false, {degrees: s.m.c[0]}, false, false, false, {degrees: s.m.c[4]}],
      [null, false, { step: lift.femur, easing: easeOut }, {degrees: s.m.f[4], easing: easeIn}, false, false, false, {degrees: s.m.f[4]}, {degrees: s.m.f[5]}, { step: lift.femur, easing: easeOut }, {degrees: s.m.f[0], easing: easeIn}, false, false, false, {degrees: s.m.f[4]}],
      [null, false, { step: lift.tibia, easing: easeOut }, {degrees: s.m.t[4], easing: easeIn}, false, false, false, {degrees: s.m.t[4]}, {degrees: s.m.t[5]}, { step: lift.tibia, easing: easeOut }, {degrees: s.m.t[0], easing: easeIn}, false, false, false, {degrees: s.m.t[4]}],

      [null, false, false, false, {degrees: s.r.c[3]}, false, false, {degrees: s.r.c[3]}, false, {degrees: s.r.c[5]}, false, {degrees: s.r.c[0]}, {degrees: s.r.c[1]}, false, {degrees: s.r.c[3]}],
      [null, false, false, { step: lift.femur, easing: easeOut }, {degrees: s.r.f[3], easing: easeIn}, false, false, {degrees: s.r.f[3]}, false, {degrees: s.r.f[5]}, { step: lift.femur, easing: easeOut }, {degrees: s.r.f[0], easing: easeIn}, {degrees: s.r.f[1]}, false, {degrees: s.r.f[3]}],
      [null, false, false, { step: lift.tibia, easing: easeOut }, {degrees: s.r.t[3], easing: easeIn}, false, false, {degrees: s.r.t[3]}, false, {degrees: s.r.t[5]}, { step: lift.tibia, easing: easeOut }, {degrees: s.r.t[0], easing: easeIn}, {degrees: s.r.t[1]}, false, {degrees: s.r.t[3]}],

      [null, false, false, false, false, false, false, {degrees: s.r.c[0]}, false, false, false, false, {degrees: s.r.c[5]}, false, {degrees: s.r.c[0]}],
      [null, false, false, false, false, false, { step: lift.femur, easing: easeOut }, {degrees: s.r.f[0], easing: easeIn}, false, false, false, false, {degrees: s.r.f[5]}, { step: lift.femur, easing: easeOut }, {degrees: s.r.f[0], easing: easeIn}],
      [null, false, false, false, false, false, { step: lift.tibia, easing: easeOut }, {degrees: s.r.t[0], easing: easeIn}, false, false, false, false, {degrees: s.r.t[5]}, { step: lift.tibia, easing: easeOut }, {degrees: s.r.t[0], easing: easeIn}]
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
      [null, false, {degrees: s.f.c[5]}, false, false, false, false, {degrees: s.f.c[5]}, false, {degrees: s.f.c[0]}, false, false, false, false, false, false, false, false, false, {degrees: s.f.c[5]}],
      [null, { step: lift.femur, easing: easeOut }, {degrees: s.f.f[5], easing: easeIn}, false, false, false, false, {degrees: s.f.f[5]}, { step: lift.femur, easing: easeOut }, {degrees: s.f.f[0], easing: easeIn}, false, false, false, false, false, false, false, false, false, {degrees: s.f.f[5]}],
      [null, { step: lift.tibia, easing: easeOut }, {degrees: s.f.t[5], easing: easeIn}, false, false, false, false, {degrees: s.f.t[5]}, { step: lift.tibia, easing: easeOut }, {degrees: s.f.t[0], easing: easeIn}, false, false, false, false, false, false, false, false, false, {degrees: s.f.t[5]}],

      [null, false, false, false, false, {degrees: s.f.c[2]}, false, {degrees: s.f.c[2]}, false, false, false, false, false, {degrees: s.f.c[5]}, false, {degrees: s.f.c[0]}, false, false, false, {degrees: s.f.c[2]}],
      [null, false, false, false, { step: lift.femur, easing: easeOut }, {degrees: s.f.f[2], easing: easeIn}, false, {degrees: s.f.f[2]}, false, false, false, false, false, {degrees: s.f.f[5]}, { step: lift.femur, easing: easeOut }, {degrees: s.f.f[0], easing: easeIn}, false, false, false, {degrees: s.f.f[2]}],
      [null, false, false, false, { step: lift.tibia, easing: easeOut }, {degrees: s.f.t[2], easing: easeIn}, false, {degrees: s.f.t[2]}, false, false, false, false, false, {degrees: s.f.t[5]}, { step: lift.tibia, easing: easeOut }, {degrees: s.f.t[0], easing: easeIn}, false, false, false, {degrees: s.f.t[2]}],

      [null, false, false, false, false, false, {degrees: s.m.c[1]}, {degrees: s.m.c[1]}, false, false, false, false, false, false, false, {degrees: s.m.c[5]}, false, {degrees: s.m.c[0]}, false, {degrees: s.m.c[1]}],
      [null, false, false, false, false, { step: lift.femur, easing: easeOut }, {degrees: s.m.f[1], easing: easeIn}, {degrees: s.m.f[1]}, false, false, false, false, false, false, false, {degrees: s.m.f[5]}, { step: lift.femur, easing: easeOut }, {degrees: s.m.f[0], easing: easeIn}, false, {degrees: s.m.f[1]}],
      [null, false, false, false, false, { step: lift.tibia, easing: easeOut }, {degrees: s.m.t[1], easing: easeIn}, {degrees: s.m.t[1]}, false, false, false, false, false, false, false, {degrees: s.m.t[5]}, { step: lift.tibia, easing: easeOut }, {degrees: s.m.t[0], easing: easeIn}, false, {degrees: s.m.t[1]}],

      [null, false, false, {degrees: s.m.c[4]}, false, false, false, {degrees: s.m.c[4]}, false, {degrees: s.m.c[5]}, false, {degrees: s.m.c[0]}, false, false, false, false, false, false, false, {degrees: s.m.c[4]}],
      [null, false, { step: lift.femur, easing: easeOut }, {degrees: s.m.f[4], easing: easeIn}, false, false, false, {degrees: s.m.f[4]}, false, {degrees: s.m.f[5]}, { step: lift.femur, easing: easeOut }, {degrees: s.m.f[0], easing: easeIn}, false, false, false, false, false, false, false, {degrees: s.m.f[4]}],
      [null, false, { step: lift.tibia, easing: easeOut }, {degrees: s.m.t[4], easing: easeIn}, false, false, false, {degrees: s.m.t[4]}, false, {degrees: s.m.t[5]}, { step: lift.tibia, easing: easeOut }, {degrees: s.m.t[0], easing: easeIn}, false, false, false, false, false, false, false, {degrees: s.m.t[4]}],

      [null, false, false, false, {degrees: s.r.c[3]}, false, false, {degrees: s.r.c[3]}, false, false, false, {degrees: s.r.c[5]}, false, {degrees: s.r.c[0]}, false, false, false, false, false, {degrees: s.r.c[3]}],
      [null, false, false, { step: lift.femur, easing: easeOut }, {degrees: s.r.f[3], easing: easeIn}, false, false, {degrees: s.r.f[3]}, false, false, false, {degrees: s.r.f[5]}, { step: lift.femur, easing: easeOut }, {degrees: s.r.f[0], easing: easeIn}, false, false, false, false, false, {degrees: s.r.f[3]}],
      [null, false, false, { step: lift.tibia, easing: easeOut }, {degrees: s.r.t[3], easing: easeIn}, false, false, {degrees: s.r.t[3]}, false, false, false, {degrees: s.r.t[5]}, { step: lift.tibia, easing: easeOut }, {degrees: s.r.t[0], easing: easeIn}, false, false, false, false, false, {degrees: s.r.t[3]}],

      [null, false, false, false, false, false, false, {degrees: s.r.c[0]}, false, false, false, false, false, false, false, false, false, {degrees: s.r.c[5]}, false, {degrees: s.r.c[0]}],
      [null, false, false, false, false, false, { step: lift.femur, easing: easeOut }, {degrees: s.r.f[0], easing: easeIn}, false, false, false, false, false, false, false, false, false, {degrees: s.r.f[5]}, { step: lift.femur, easing: easeOut }, {degrees: s.r.f[0], easing: easeIn}],
      [null, false, false, false, false, false, { step: lift.tibia, easing: easeOut }, {degrees: s.r.t[0], easing: easeIn}, false, false, false, false, false, false, false, false, false, {degrees: s.r.t[5]}, { step: lift.tibia, easing: easeOut }, {degrees: s.r.t[0], easing: easeIn}]
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

        [null, false, false, false, false, false, {degrees: h.f.c[a]}, false, {degrees: h.f.c[1]}, {degrees: h.f.c[b]}],
        [null, false, false, false, false, { step: lift.femur, easing: easeOut }, {degrees: h.f.f[a]}, false, {degrees: h.f.f[1]}, {degrees: h.f.f[b]}],
        [null, false, false, false, false, { step: lift.tibia, easing: easeOut }, {degrees: h.f.t[a]}, false, {degrees: h.f.t[1]}, {degrees: h.f.t[b]}],

        [null, false, false, false, {degrees: h.m.c[a]}, false, false, false, {degrees: h.m.c[1]}, {degrees: h.m.c[b]}],
        [null, false, false, { step: lift.femur, easing: easeOut }, {degrees: h.m.f[a]}, false, false, false, {degrees: h.m.f[1]}, {degrees: h.m.f[b]}],
        [null, false, false, { step: lift.tibia, easing: easeOut }, {degrees: h.m.t[a]}, false, false, false, {degrees: h.m.t[1]}, {degrees: h.m.t[b]}],

        [null, false, {degrees: h.r.c[b]}, false, false, false, false, false, {degrees: h.r.c[1]}, {degrees: h.r.c[a]}],
        [null, { step: lift.femur, easing: easeOut },  {degrees: h.r.f[b]}, false, false, false, false, false, {degrees: h.r.f[1]}, {degrees: h.r.f[a]}],
        [null, { step: lift.tibia, easing: easeOut }, {degrees: h.r.t[b]}, false, false, false, false, false, {degrees: h.r.t[1]}, {degrees: h.r.t[a]}],

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
        [null, false, {degrees: h.f.c[a]}, false, false, false, false, false, {degrees: h.f.c[1]}, {degrees: h.f.c[b]}],
        [null, { step: lift.femur, easing: easeOut },  {degrees: h.f.f[a]}, false, false, false, false, false, {degrees: h.f.f[1]}, {degrees: h.f.f[b]}],
        [null, { step: lift.tibia, easing: easeOut }, {degrees: h.f.t[a]}, false, false, false, false, false, {degrees: h.f.t[1]}, {degrees: h.f.t[b]}],

        [null, false, false, false, {degrees: h.m.c[a]}, false, false, false, {degrees: h.m.c[1]}, {degrees: h.m.c[b]}],
        [null, false, false, { step: lift.femur, easing: easeOut }, {degrees: h.m.f[a]}, false, false, false, {degrees: h.m.f[1]}, {degrees: h.m.f[b]}],
        [null, false, false, { step: lift.tibia, easing: easeOut }, {degrees: h.m.t[a]}, false, false, false, {degrees: h.m.t[1]}, {degrees: h.m.t[b]}],

        [null, false, false, false, false, false, {degrees: h.r.c[b]}, false, {degrees: h.r.c[1]}, {degrees: h.r.c[a]}],
        [null, false, false, false, false, { step: lift.femur, easing: easeOut }, {degrees: h.r.f[b]}, false, {degrees: h.r.f[1]}, {degrees: h.r.f[a]}],
        [null, false, false, false, false, { step: lift.tibia, easing: easeOut }, {degrees: h.r.t[b]}, false, {degrees: h.r.t[1]}, {degrees: h.r.t[a]}],
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
        [ null, false, {degrees: t.f.c[a]}, false, {degrees: t.f.c[b]}, false, {degrees: t.f.c[a]}],
        [ null, false, {degrees: t.f.f[a]}, { step: lift.femur, easing: easeOut }, {degrees: t.f.f[b]}, false, {degrees: t.f.f[a]}],
        [ null, false, {degrees: t.f.t[a]}, { step: lift.tibia, easing: easeOut }, {degrees: t.f.t[b]}, false, {degrees: t.f.t[a]}],

        [ null, false, {degrees: t.f.c[a]}, false, {degrees: t.f.c[b]}, false, {degrees: t.f.c[a]}],
        [ null, { step: lift.femur, easing: easeOut }, {degrees: t.f.f[a], easing: easeIn}, false, {degrees: t.f.f[b], easing: easeIn}, { step: lift.femur, easing: easeOut }, {degrees: t.f.f[a], easing: easeIn}],
        [ null, { step: lift.tibia, easing: easeOut }, {degrees: t.f.t[a], easing: easeIn}, false, {degrees: t.f.t[b], easing: easeIn}, { step: lift.tibia, easing: easeOut }, {degrees: t.f.t[a], easing: easeIn}],

        [ null, false, {degrees: t.m.c[b]}, false, {degrees: t.m.c[a]}, false, {degrees: t.m.c[b]}],
        [ null, { step: lift.femur, easing: easeOut }, {degrees: t.m.f[b], easing: easeIn}, false, {degrees: t.m.f[a], easing: easeIn}, { step: lift.femur, easing: easeOut }, {degrees: t.m.f[b], easing: easeIn}],
        [ null, { step: lift.tibia, easing: easeOut }, {degrees: t.m.t[b], easing: easeIn}, false, {degrees: t.m.t[a], easing: easeIn}, { step: lift.tibia, easing: easeOut }, {degrees: t.m.t[b], easing: easeIn}],

        [ null, false, {degrees: t.m.c[b]}, false, {degrees: t.m.c[a]}, false, {degrees: t.m.c[b]}],
        [ null, false, {degrees: t.m.f[b]}, { step: lift.femur, easing: easeOut }, {degrees: t.m.f[a]}, false, {degrees: t.m.f[b]}],
        [ null, false, {degrees: t.m.t[b]}, { step: lift.tibia, easing: easeOut }, {degrees: t.m.t[a]}, false, {degrees: t.m.t[b]}],

        [ null, false, {degrees: t.r.c[b]}, false, {degrees: t.r.c[a]}, false, {degrees: t.r.c[b]}],
        [ null, false, {degrees: t.r.f[b]}, { step: lift.femur, easing: easeOut }, {degrees: t.r.f[a]}, false, {degrees: t.r.f[b]}],
        [ null, false, {degrees: t.r.t[b]}, { step: lift.tibia, easing: easeOut }, {degrees: t.r.t[a]}, false, {degrees: t.r.t[b]}],

        [ null, false, {degrees: t.r.c[b]}, false, {degrees: t.r.c[a]}, false, {degrees: t.r.c[b]}],
        [ null, { step: lift.femur, easing: easeOut }, {degrees: t.r.f[b], easing: easeIn}, false, {degrees: t.r.f[a], easing: easeIn}, { step: lift.femur, easing: easeOut }, {degrees: t.r.f[b], easing: easeIn}],
        [ null, { step: lift.tibia, easing: easeOut }, {degrees: t.r.t[b], easing: easeIn}, false, {degrees: t.r.t[a], easing: easeIn}, { step: lift.tibia, easing: easeOut }, {degrees: t.r.t[b], easing: easeIn}]
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

    var moving = Math.max(work, function(leg){ return leg.offset; });

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

  phoenix.waveLeft = function() {
    legsAnimation.enqueue(waveLeft);
  };

  phoenix.waveRight = function() {
    legsAnimation.enqueue(waveRight);
  };

  phoenix.stand = function() {
    legsAnimation.enqueue(stand);
  };

  phoenix.stop = function() {
    legsAnimation.stop();
  };

}

// module.exports = actions;
module.exports = {
  setup: setActions
};
