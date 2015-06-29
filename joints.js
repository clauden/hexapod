var   five = require("johnny-five");

var setup = function(phoenix) {

    // deal with unassigned stuff... there must be an easier way to do this, like method_missing?.
    for (side of ['r', 'l']) {
      for (leg of [1,2,3]) {
        for (joint of ['c', 'f', 't']) {
          name = "" + side + leg + joint;
          if (typeof(phoenix[name]) === 'undefined') {
            console.log("Assigning default pin to " + name);
            phoenix[name] = new five.Servo({pin:99});
          }
        }
      }
    }
   
    // Servos grouped by joints (used in stand)
    phoenix.femurs = new five.Servo.Array([phoenix.r1f, phoenix.l1f, phoenix.r2f, phoenix.l2f, phoenix.r3f, phoenix.l3f]);
    phoenix.tibia = new five.Servo.Array([phoenix.r1t, phoenix.l1t, phoenix.r2t, phoenix.l2t, phoenix.r3t, phoenix.l3t]);
    phoenix.coxa = new five.Servo.Array([phoenix.r1c, phoenix.l1c, phoenix.r2c, phoenix.l2c, phoenix.r3c, phoenix.l3c]);
    phoenix.innerCoxa = new five.Servo.Array([phoenix.r2c, phoenix.l2c]);
    phoenix.outerCoxa = new five.Servo.Array([phoenix.r1c, phoenix.l1c, phoenix.r3c, phoenix.l3c]);

    // Servos grouped by joints & leg pairs (used in row)
    phoenix.frontCoxa = new five.Servo.Array([phoenix.r1c, phoenix.l1c]);
    phoenix.frontFemur = new five.Servo.Array([phoenix.r1f, phoenix.l1f]);
    phoenix.frontTibia = new five.Servo.Array([phoenix.r1t, phoenix.l1t]);
    phoenix.midCoxa = new five.Servo.Array([phoenix.r2c, phoenix.l2c]);
    phoenix.midFemur = new five.Servo.Array([phoenix.r2f, phoenix.l2f]);
    phoenix.midTibia = new five.Servo.Array([phoenix.r2t, phoenix.l2t]);
    phoenix.rearCoxa = new five.Servo.Array([phoenix.r3c, phoenix.l3c]);
    phoenix.rearFemur = new five.Servo.Array([phoenix.r3f, phoenix.l3f]);
    phoenix.rearTibia = new five.Servo.Array([phoenix.r3t, phoenix.l3t]);

    phoenix.leftOuterCoxa = new five.Servo.Array([phoenix.l1c, phoenix.l3c]);
    phoenix.rightOuterCoxa = new five.Servo.Array([phoenix.r1c, phoenix.r3c]);
    phoenix.leftOuterFemur = new five.Servo.Array([phoenix.l1f, phoenix.l3f]);
    phoenix.rightOuterFemur = new five.Servo.Array([phoenix.r1f, phoenix.r3f]);
    phoenix.leftOuterTibia = new five.Servo.Array([phoenix.l1t, phoenix.l3t]);
    phoenix.rightOuterTibia = new five.Servo.Array([phoenix.r1t, phoenix.r3t]);

    phoenix.jointPairs = new five.Servo.Array([
      phoenix.frontCoxa, phoenix.frontFemur, phoenix.frontTibia,
      phoenix.midCoxa, phoenix.midFemur, phoenix.midTibia,
      phoenix.rearCoxa, phoenix.rearFemur, phoenix.rearTibia
    ]);

    phoenix.joints = new five.Servo.Array([phoenix.coxa, phoenix.femurs, phoenix.tibia]);
    phoenix.altJoints = new five.Servo.Array([phoenix.innerCoxa, phoenix.outerCoxa, phoenix.femurs, phoenix.tibia]);
    phoenix.triJoints = new five.Servo.Array([phoenix.leftOuterCoxa, phoenix.r2c, phoenix.leftOuterFemur, phoenix.r2f, phoenix.leftOuterTibia, phoenix.r2t, phoenix.rightOuterCoxa, phoenix.l2c, phoenix.rightOuterFemur, phoenix.l2f, phoenix.rightOuterTibia, phoenix.l2t]);

    phoenix.legs = new five.Servo.Array([phoenix.r1c, phoenix.r1f, phoenix.r1t, phoenix.l1c, phoenix.l1f, phoenix.l1t, phoenix.r2c, phoenix.r2f, phoenix.r2t, phoenix.l2c, phoenix.l2f, phoenix.l2t, phoenix.r3c, phoenix.r3f, phoenix.r3t, phoenix.l3c, phoenix.l3f, phoenix.l3t]);

}

module.exports =  {setup: setup} ;
