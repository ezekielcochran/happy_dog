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

// Vertex information stored in object_points/dog_triangles.js

var points = [];
var colors = [];
var texCoords = [];

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

var texSize = 64;
var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
]

var image1 = new Array()
    for (var i =0; i<texSize; i++)  image1[i] = new Array();
    for (var i =0; i<texSize; i++) 
        for ( var j = 0; j < texSize; j++) 
           image1[i][j] = new Float32Array(4);
    for (var i =0; i<texSize; i++) for (var j=0; j<texSize; j++) {
        var c = (((i & 0x8) == 0) ^ ((j & 0x8)  == 0));
        image1[i][j] = [c, c, c, 1];
    }

var image2 = new Uint8Array(4*texSize*texSize);
    for ( var i = 0; i < texSize; i++ ) 
        for ( var j = 0; j < texSize; j++ ) 
           for(var k =0; k<4; k++) 
                image2[4*texSize*i+4*j+k] = 255*image1[i][j][k];

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

    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW);
    var vTexCoord = gl.getAttribLocation( program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);
    
    configureTexture(image2);

    rotationMatrixLoc = gl.getUniformLocation(program, "rotationMatrix");
    bigWagAngleLoc = gl.getUniformLocation(program, "bigWagAngle");

    canvas.onmousedown = function(event) {
        click(event);
    };
    canvas.onmousemove = function(event) {
        drag(event);
    };
    canvas.onmouseup = function(event) {
        release(event);
    };

    render();
}

function configureTexture(image) {
    var texture = gl.createTexture();
    gl.activeTexture( gl.TEXTURE0 );
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, 
        gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, 
        gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
}

// takes 2 vec4 variables, returns float
function euclidianDistance(point1, point2) {
    var dx = point1[0] - point2[0];
    var dy = point1[1] - point2[1];
    var dz = point1[2] - point2[2];
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
}

// helper function for pickTextureCoords
function coordsFromSides(ab, bc, ac) {
    var p = (ac*ac - bc*bc + ab*ab) / (2 * ab);
    var q = Math.sqrt(ac*ac - p*p);
    // var q = 0.1
    return vec2(p / ab, q / ab);
}

// takes in a triangle described by vec4 coordinates a, b, c and returns texture coordinates in respective order
// so that the longest triangle side is mapped to the segment from (0, 0) to (1, 0) and the third coordinate
// is picked so that there is no image warping
// takes an array of vec4 variables, and returns an array of vec2 variables.
function pickTextureCoords(triangle) {
    var ab = euclidianDistance(triangle[0], triangle[1]);
    var bc = euclidianDistance(triangle[1], triangle[2]);
    var ac = euclidianDistance(triangle[0], triangle[2]);
    var max = Math.max(ab, bc, ac);
    var result = Array()

    if (max == ab) {
        result[0] = vec2(0, 0);
        result[1] = vec2(1, 0);
        // result[2] = coordsFromSides(bc, ac, ab);
        result[2] = coordsFromSides(ab, bc, ac);
    } else if (max == bc) {
        // result[0] = coordsFromSides(ac, ab, bc);
        result[0] = coordsFromSides(bc, ac, ab);
        result[1] = vec2(0, 0);
        result[2] = vec2(1, 0);
    } else if (max == ac) {
        result[2] = vec2(0, 0);
        result[0] = vec2(1, 0);
        // result[2] = coordsFromSides(ab, bc, ac);
        result[1] = coordsFromSides(ac, ab, bc);
    }

    return result;
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

    // we use a separate loop to push the texture values so that we can consdier a triangle at a time
    for (var i = 0; i < dogVertices.length; i += 3) {
        var tempCoords = pickTextureCoords(Array(dogVertices[i], dogVertices[i + 1], dogVertices[i + 2]))
        texCoords.push(tempCoords[0]);
        texCoords.push(tempCoords[1]);
        texCoords.push(tempCoords[2]);
    }
    for (var i = 0; i < tailVertices.length; i += 3) {
        var tempCoords = pickTextureCoords(Array(tailVertices[i], tailVertices[i + 1], tailVertices[i + 2]))
        texCoords.push(tempCoords[0]);
        texCoords.push(tempCoords[1]);
        texCoords.push(tempCoords[2]);
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

function click(event) {
    mouseDrag = getMousePos(event);
}

function drag(event) {
    if (mouseDrag) {
        var mousePos = getMousePos(event);
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
