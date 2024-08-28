// Filename: dog.js
// Author: Ezekiel Cochran
// Date: Sep 30, 2023
// Class: Computer Graphics
// Assignment: Enhanced Render
// Description: Main .js file used for rendering dog

// One quirkly little feature... if you click on the canvas and release the mouse off of it, when the cursor re-enters the canvas, the program still thinks you are dragging

"use strict";

var canvas;
var gl;

// "numPonts", "vertices", and "connectionVertices" variables are defined in ./object_points/dog_triangles.js

var points = [];
var colors = [];

var azimuthal = -135;
var elevation = 90;

var DEGREES_PER_PIXEL = 0.23;
var mouseDrag = null; // holds the 'last' x, y position as the mouse is being dragged

var rotationMatrix;
var rotationMatrixLoc;
var bigWagAngle;
var bigWagAngleLoc;
var BIG_WAG_ANGLE_MAX = 2.0;
var wagTime = 0;
var dWagTime = 8;
var currentDate = new Date()
var previousTime = currentDate.getTime();
var currentTime;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    dog();

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );


    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    rotationMatrixLoc = gl.getUniformLocation(program, "rotationMatrix");
    bigWagAngleLoc = gl.getUniformLocation(program, "bigWagAngle");

    canvas.onmousedown = function(event) {
        click(event, 0);
    };
    canvas.onmousemove = function(event) {
        drag(event, 0);
    };
    canvas.onmouseup = function(event) {
        release(event);
    };

    canvas.ontouchstart = function(event) {
        click(event, 1);
        // prevents default touch behavior (scrolling, zooming, etc.)
        event.preventDefault();
    };
    canvas.ontouchmove = function(event) {
        drag(event, 1);
        event.preventDefault();
    };
    canvas.ontouchend = function(event) {
        release(event);
        event.preventDefault();
    };

    render();
}


function dog()
{
    var triangleColor = randomGoldColor();

    // we'll tell the shader which points are body and tail by temporarily setting
    // the homogenous coordinate of body points to zero (the shader puts the 1.0 back when rendering)
    for (var i = 0; i < dogVertices.length; i++) {
        var temp = vec4(dogVertices[i][0], dogVertices[i][1], dogVertices[i][2], 0.0);
        points.push(temp);
        colors.push(triangleColor);
        if (i % 3 == 2) {
            triangleColor = randomGoldColor();
        }
    }

    // similarly, we'll set the homogenous coordinate of tail vertices to "distance from butt" so the shader knows how much to wag it
    for (var i = 0; i < tailVertices.length; i++) {
        if (isConnectingPoint(tailVertices[i])) { // we leave these stationary, so they connect with the body of the dog
            var temp = vec4(tailVertices[i][0], tailVertices[i][1], tailVertices[i][2], 0.0);
        } else {
            var temp = vec4(tailVertices[i][0], tailVertices[i][1], tailVertices[i][2], distanceFromTailCentroid(tailVertices[i]));
        }
        points.push(temp);
        colors.push(triangleColor);
        if (i % 3 == 2) {
            triangleColor = randomGoldColor();
        }
    }
}

function distanceFromTailCentroid(point) {
    var centroid = vec4(0.0, 0.2919880959497081, 0.08370484856832476, 1.0);
    var dx = point[0] - centroid[0];
    var dy = point[1] - centroid[1];
    var dz = point[2] - centroid[2];
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
}

function getMousePos(event) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    }
}
function getTouchPos(event) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: event.touches[0].clientX - rect.left,
        y: event.touches[0].clientY - rect.top
    }
}

// type 0 is mouse, type 1 is touch
function click(event, type) {
    if (type == 0) {
        mouseDrag = getMousePos(event);
    } else {
        mouseDrag = getTouchPos(event);
    }
}

// type 0 is mouse, type 1 is touch
function drag(event, type) {
    if (mouseDrag) {
        var mousePos;
        if (type == 0) {
            mousePos = getMousePos(event);
        } else {
            mousePos = getTouchPos(event);
        }
        var dx = mousePos.x - mouseDrag.x;
        var dy = mousePos.y - mouseDrag.y;
        updateDogAngle(dx, dy);
        mouseDrag = mousePos;
    }
}

function release() {
    mouseDrag = null;
}

// we test to see which way the dog is facing, and an upward mouse drag will move the
// "nearer" half of the dog up
// (this does result in some awkward motion when the dog is close to sideways)
function updateDogAngle(dx, dy) {
    azimuthal += DEGREES_PER_PIXEL * dx;
    if (90 <= azimuthal && azimuthal < 270) {
        elevation -= DEGREES_PER_PIXEL * dy;
    } else {
        elevation += DEGREES_PER_PIXEL * dy;
    }
}

// the vertices shared by the body and tail of the dog
function isConnectingPoint(point) {
    for (var i = 0; i < connectingVertices.length; i++) {
        if (equal(point, connectingVertices[i])) {
            return true;
        }
    }
    return false;
}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // we loop the azimuthal coordinate around, keeping it between 0 and 2 pi
    while (azimuthal > 360) {
        azimuthal -= 360;
    }
    while (azimuthal < 0) {
        azimuthal += 360;
    }

    // the elevation variable, on the other hand, we restrict [0, pi]... note that because we have no roll variable, this means we cannot turn the dog upside down
    if (elevation > 180) {
        elevation = 180;
    } else if (elevation < 0) {
        elevation = 0;
    }

    // Build rotation matrix
    // 0, 1, 0 corresponds to y-axis
    // takes angle argument in degrees, not radians, and returns a true matrix (list of lists), not a 16 number array
    // HELP I give -1 so that the object rotates the way i expect it to... but don't know why it doesn't naturally????
    var azimuthalRotation = rotate(azimuthal, 0.0, -1.0, 0.0);
    // (-sin phi, 0, cos phi) points in the direction the dog faces, so we add 90 to get the appropriate axis of elevation rotation, depending on azimuthal angle phi
    var elevationRotation = rotate(elevation, -Math.sin(radians(azimuthal + 90)), 0, Math.cos(radians(azimuthal + 90)));
    // combine these two into our final rotation matrix, applying azimuthal first and then elevation
    rotationMatrix = mult(elevationRotation, azimuthalRotation)
    gl.uniformMatrix4fv(rotationMatrixLoc, false, flatten(rotationMatrix));

    // Makes the wag speed constant, not dependant on how often the animation function is called
    currentTime = Date.now();
    wagTime += (currentTime - previousTime) * dWagTime / 1000;
    previousTime = currentTime;
    // Simple sin function to control the motion of the tail
    while (wagTime > 2 * Math.PI) {
        wagTime -= 2 * Math.PI;
    }
    bigWagAngle = BIG_WAG_ANGLE_MAX * Math.sin(wagTime);
    gl.uniform1f(bigWagAngleLoc, bigWagAngle);

    gl.drawArrays( gl.TRIANGLES, 0, numPoints );

    requestAnimFrame( render );
}