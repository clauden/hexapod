cornerInset = 7.8;
innerX = 60;                // 60.8;
innerY =  42;               // 42.8;
outerX = innerX + 2 * cornerInset;
outerY = innerY + 2 * cornerInset;

lipWidth = 4;
rimHeight = 2;
trayDepth = 10;
trayBottomThickness = 4;
trayWallThickness = 2.5;

boardX = 59;
boardY = 28;
boardThickness = 6;
boardOffsetX = (outerX - boardX) / 2;
boardOffsetY = (outerY - boardY) / 2 ;


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
    //translate([-lipWidth, -lipWidth, 0]) 
      //  cube([outerX + 2*lipWidth, outerY + 2*lipWidth, rimHeight]);
        
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
    translate([17.3 + 38 + boardOffsetX + lipWidth, 
            lipWidth + cornerInset + boardY - 2.8, -trayDepth])
        standoff();
    translate([17.3 + boardOffsetX + lipWidth, 
            lipWidth + cornerInset + boardY - 2.8, -trayDepth])
        standoff();
}



// translate([boardOffsetX, boardOffsetY, -(trayDepth - standoffHeight)])
//    board();

// board simulation
module board() {
    
    // pcb
    color("green") cube([boardX, boardY, boardThickness]);
    
    // servo plugs
    translate([0,0,boardThickness])
        color("yellow")
            cube([boardX,8,15]);
    translate([0, 8,boardThickness])
        color("yellow")
            cube([8, boardY-8, 15]); 
    translate([5, 2, 15 + boardThickness])
        color("black")
            text(size = 4, "servo connectors");
     
    // usb
    translate([boardX-10, 18, boardThickness]) {
        color("black") 
            cube([35, 10, 15]);
        translate([6,4,15])
            color("white") 
                text(size=4, "usb");
    }
    
    translate([boardX - 3, 14, 0])
        screwHole();
  
    translate([17.3, boardY - 2.8, 0])
        screwHole();
  
 
}

module supports() {
    translate([-lipWidth, -lipWidth, -(trayDepth + trayBottomThickness)]) 
        color("black") 
        support(cornerInset+lipWidth-1, cornerInset+lipWidth-1,  trayDepth + trayBottomThickness);
    translate([outerX - cornerInset, -lipWidth, -(trayDepth + trayBottomThickness)])
        color("blue") 
        support(cornerInset+lipWidth-1, cornerInset+lipWidth-1,  trayDepth + trayBottomThickness);
   
    translate([-lipWidth, outerY - cornerInset + 1,-(trayDepth + trayBottomThickness)])
        color("green") 
        support(cornerInset+lipWidth-1, cornerInset+lipWidth-2,  trayDepth + trayBottomThickness);
    translate([outerX - cornerInset, outerY - cornerInset +1,-(trayDepth + trayBottomThickness)])
        color("red") 
        support(cornerInset+lipWidth-1, cornerInset+lipWidth-1,  trayDepth + trayBottomThickness);
    
    translate([cornerInset , -lipWidth, -(trayDepth + trayBottomThickness)])
        color("orange")
        support(innerX -1,  lipWidth - 1, trayDepth + trayBottomThickness);
     translate([cornerInset , outerY, -(trayDepth + trayBottomThickness)])
        color("orange")
        support(innerX -1,  lipWidth - 1, trayDepth + trayBottomThickness);
     translate([-lipWidth , cornerInset, -(trayDepth + trayBottomThickness)])
        color("orange")
        support(lipWidth -1,  innerY- 1, trayDepth + trayBottomThickness);
     translate([outerX  - cornerInset + lipWidth*2 , cornerInset, -(trayDepth + trayBottomThickness)])
        color("orange")
        support(lipWidth -1,  innerY- 1, trayDepth + trayBottomThickness);
}    

//supports();

supportStepX = 1;
supportStepY = 1;
supportBumpRadius = .5;

// 
// support is made up of narrow towers with little balls on them
// parameters represent x,y,z extents of structure
module support(supportX, supportY, supportZ) {
    
    numSupports = round(supportY / supportStepY);
    bumpStep = round(supportX / (.5 + supportBumpRadius*2));
    bumpOffset = supportX/(supportBumpRadius*2);
    
    echo("support: ", bumpOffset, numSupports, " : ", supportX, supportY, supportZ);
        
    
    for (offset = [0 : supportStepY *2 : numSupports]) {
        echo ("step: ", offset);
        translate([supportBumpRadius, offset, 0]) {
            color("violet") 
                cube([supportX, supportStepY, supportZ - supportBumpRadius]);
            for (x = [supportBumpRadius +.5 : 2*supportBumpRadius +.5 : supportX - supportBumpRadius/2]) {
                translate([x,supportStepY/2, supportZ - supportBumpRadius])
                    sphere(r=supportBumpRadius, $fn=16);
            }
        }
    }
    
}



// support(cornerInset+lipWidth-1, cornerInset+lipWidth-1,  trayDepth + trayBottomThickness);





module support1() {
    
        // make this hollow!
        cube([cornerInset+lipWidth-14e, cornerInset+lipWidth-1, trayDepth + trayBottomThickness - 0.2]);
        for (y = [0 : supportStepY: cornerInset-2]) {
            for (x = [0 : supportStepX : cornerInset-2]) {
                translate([x,y, trayDepth + trayBottomThickness - 0.2])
                    sphere(r=0.2, $fn=16);
             }
         }
 }
 
/*
    translate([-1, outerY - cornerInset ,-(trayDepth + trayBottomThickness + 1)])
            cube([cornerInset+1, cornerInset+1, 2 * trayDepth]);
        translate([outerX - cornerInset,-1,-(trayDepth + trayBottomThickness + 1)])
            cube([cornerInset+1, cornerInset+1, 2 * trayDepth]);
        translate([outerX - cornerInset, outerY - cornerInset ,-(trayDepth + trayBottomThickness + 1)])
            cube([cornerInset+1, cornerInset+1, 2 * trayDepth]);
*/


//
// main begins
///
difference() {

    fullTrayShell();
    screwHoles();
}


standoffs();

// metrics
// translate([cornerInset/2,-10, 0])
//    cube([innerX+cornerInset, 1, 1]);

// translate([-10, cornerInset/2, 0])
//    cube([1, innerY+cornerInset, 1]);

