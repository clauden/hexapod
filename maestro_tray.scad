cornerInset = 7.8;
innerX = 61;
innerY = 42.8;
outerX = innerX + 2 * cornerInset;
outerY = innerY + 2 * cornerInset;

lipWidth = 5;
rimHeight = 2;
trayDepth = 15;
trayBottomThickness = 5;
trayWallThickness = 2.5;

boardX = 59;
boardY = 28;
boardOffsetX = 10;

screwDiameter = 3;
standoffHeight = trayDepth - 5;

module fullTray() {
    
    translate([0,0,-(trayDepth + trayBottomThickness)])
        cube([outerX, outerY, trayDepth + trayBottomThickness]);
}

module corneredTray() {
    color("pink") 
    difference() {
        fullTray();
        
        // cut out corners
        translate([-1,-1,-(trayDepth + trayBottomThickness + 1)])
            cube([cornerInset+1, cornerInset+1, 2 * trayDepth]);
        translate([-1, outerY - cornerInset ,-(trayDepth + trayBottomThickness + 1)])
            cube([cornerInset+1, cornerInset+1, 2 * trayDepth]);
        translate([outerX - cornerInset,-1,-(trayDepth + trayBottomThickness + 1)])
            cube([cornerInset+1, cornerInset+1, 2 * trayDepth]);
        translate([outerX - cornerInset, outerY - cornerInset ,-(trayDepth + trayBottomThickness + 1)])
            cube([cornerInset+1, cornerInset+1, 2 * trayDepth]);
        
    }
}

module fullTrayShell() {
    difference() {
        corneredTray();
        
        // cut out inner horizontal
        translate([cornerInset + trayWallThickness, trayWallThickness,-(trayDepth-trayBottomThickness)])
           cube([outerX - 2*cornerInset - 2*trayWallThickness, 
                 outerY -  2*trayWallThickness, 
                 trayDepth+1]);
        
        // cut out inner vertical
        translate([trayWallThickness, cornerInset + trayWallThickness,-(trayDepth - trayBottomThickness)])
           cube([outerX - 2*trayWallThickness, 
                 outerY - 2*cornerInset - 2*trayWallThickness, 
                 trayDepth]);

    //    translate([trayWallThickness,trayWallThickness,-trayDepth])
    //        cube([outerX - 2*trayWallThickness, outerY - 2*trayWallThickness, trayDepth]);
    }
}

fullTrayShell();
upperRim();

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
    translate([17.3 + 38 + boardOffsetX + lipWidth, lipWidth + cornerInset + boardY - 2.8, -trayDepth])
        standoff();
    translate([17.3 + boardOffsetX + lipWidth, lipWidth + cornerInset + boardY - 2.8, -trayDepth])
        standoff();
}



difference() {
    union() {
        // upperRim();
        // lowerTray();
    }
    screwHoles();
}

translate([lipWidth + cornerInset/2,-5, 0])
    cube([innerX+cornerInset, 1, 1]);

translate([-5, lipWidth + cornerInset/2, 0])
    cube([1, innerY+cornerInset, 1]);

standoffs();