// Filename: colors.js
// Author: Ezekiel Cochran
// Date: Sep 30, 2023
// Class: Computer Graphics
// Assignment: Enhanced Render
// Description: Just a separate spot to put some of the color-generating code for the dog

function dc() {
    return [1.0, 0.3 + deviate(0.3), 0.3 + deviate(0.3), 1.0];
}

function tc() {
    return [0.3 + deviate(0.3), 0.3 + deviate(0.3), 1.0, 1.0];
}

function randomColor() {
    return [Math.random(), Math.random() * 3 / 4, 0.8, 1.0];
}

function randomGoldColor() {
    var shade = deviate(0.3);
    return [0.77 + shade + deviate(0.05), 0.53 + shade + deviate(0.05), 0.35 + shade + deviate(0.05), 1.0];
}

function deviate( delta ) {
    return Math.random() * 2 * delta - delta;
}