cornerInset = 7.8;
innerX = 61;
innerY = 42.8;
outerX = innerX + 2 * cornerInset;
outerY = innerY + 2 * cornerInset;

lipWidth = 5;
rimHeight = 2;
trayDepth = 15;
trayBottomThickness = 7;
trayWallThickness = 1;

boardX = 59;
boardY = 28;
boardOffsetX = 10;

screwDiameter = 3;
standoffHeight = trayDepth - 5;

module upperRim() {
    difference() {
        cube([outerX + 2*lipWidth, outerY + 2*lipWidth, rimHeight]);
        translate([cornerInset + lipWidth, cornerInset + lipWidth,-1])
            cube([innerX, innerY, 2 * rimHeight]);
    }
}

module lowerTray() {
    translate([cornerInset + lipWidth, cornerInset+ lipWidth, -(trayDepth + trayBottomThickness)])
        difference() {
            cube([innerX, innerY, trayBottomThickness + trayDepth + rimHeight]);
            translate([trayWallThickness, trayWallThickness, trayBottomThickness])
                 cube([innerX - trayWallThickness*2, innerY - trayWallThickness*2, 
                                          (trayBottomThickness + trayDepth)*2]);
        
            }
}

module screwHole() {
    cylinder(r=1.5, h=20, $fn=30);
}

module screwHoles() {
    translate([lipWidth + cornerInset/2, lipWidth + cornerInset/2, -10])
        screwHole();
    translate([lipWidth + outerX - cornerInset/2, lipWidth + cornerInset/2, -10])
        screwHole();
    translate([lipWidth + cornerInset/2, outerY + lipWidth - cornerInset/2, -10])
        screwHole();
    translate([lipWidth + outerX  - cornerInset/2, outerY + lipWidth - cornerInset/2, -10])
        screwHole();
}

module standoff() {
    difference() {
        cylinder(r = screwDiameter, h=10, $fn=30);
        screwHole();
    }
}

module standoffs() {
    // ???
    translate([17.3 + boardOffsetX, lipWidth + cornerInset + boardY - 2.8, -trayDepth])
        standoff();
}



difference() {
    union() {
        upperRim();
        lowerTray();
    }
    screwHoles();
}

translate([lipWidth + cornerInset/2,-5, 0])
    cube([innerX+cornerInset, 1, 1]);

translate([-5, lipWidth + cornerInset/2, 0])
    cube([1, innerY+cornerInset, 1]);

standoffs();