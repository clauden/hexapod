var setPositions = function() {

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
  }
}

module.exports = { setPositions : setPositions }

