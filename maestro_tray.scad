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

// from outer edge of inset
screwOffsetX = 3.6;         
screwOffsetY = 3.6;

screwDiameter = 3;
standoffHeight = trayDepth - 6;

//
// NOTE: distance between inner corners is off, board should fit snugly between them...
//

module corneredTray() {
    color("pink") 
    difference() {
        
        // the box
        translate([0,0,-(trayDepth + trayBottomThickness)])
            cube([outerX, outerY, trayDepth + trayBottomThickness]);
        
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
    
    // the rim on top of the box
    translate([-lipWidth, -lipWidth, 0]) 
        cube([outerX + 2*lipWidth, outerY + 2*lipWidth, rimHeight]);
        
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

    }
}


module screwHole() {
    cylinder(r=1.5, h= 2 * (trayDepth + trayBottomThickness), $fn=30);
}

module screwHoles() {
    translate([cornerInset/2, cornerInset/2, -(trayDepth + trayBottomThickness + 1)])
        screwHole();
    translate([outerX - cornerInset/2, cornerInset/2, -(trayDepth + trayBottomThickness + 1)])
        screwHole();
    translate([cornerInset/2, outerY - cornerInset/2, -(trayDepth + trayBottomThickness + 1)])
        screwHole();
    translate([outerX  - cornerInset/2, outerY - cornerInset/2, -(trayDepth + trayBottomThickness + 1)])
        screwHole();
}

module standoff() {
    difference() {
        cylinder(r = screwDiameter, h = standoffHeight, $fn=30);
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

    fullTrayShell();
    screwHoles();
}

translate([cornerInset + 1, 5, -(trayDepth - standoffHeight)])
    board();

// board simulation
module board() {
    
    // pcb
    color("green") cube([59,28,7]);
    
    // servo plugs
    translate([0,0,7])
        color("yellow")
            cube([59,8,15]);
    translate([0, 8,7])
        color("yellow")
            cube([8, 28-8, 15]); 
    translate([5,2, 15+7])
        color("black")
            text(size = 4, "servo connectors");
     
    // usb
    translate([59-10, 18,7]) {
        color("black") 
            cube([35, 10, 15]);
        translate([6,4,15])
            color("white") 
                text(size=4, "usb");
    }
    
    translate([59-3, 14, 0])
        screwHole();
  
    translate([17.3, 28-2.8, 0])
        screwHole();
  
 
}


translate([cornerInset/2,-10, 0])
    cube([innerX+cornerInset, 1, 1]);

translate([-10, cornerInset/2, 0])
    cube([1, innerY+cornerInset, 1]);

standoffs();