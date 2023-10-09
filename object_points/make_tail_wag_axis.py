#!/usr/local/bin/python

import math

vertices = {}

def parse(jsv):
    segments = jsv.split()
    result = [segments[0][5:-1], segments[1][:-1], segments[2][:-1]]
    return [float(x) for x in result]

def normalize(v):
    ss = 0
    for element in v:
        ss += element * element
    ss = math.sqrt(ss)
    return [e / ss for e in v]

with open("dog_triangles_separated.js", "r") as f:
    lines = f.readlines()
    i = 0
    for line in lines:
        i += 1
        if (i == 1982):
            vertices[1] = parse(line)
        elif (i == 1978):
            vertices[2] = parse(line)
        elif (i == 1979):
            vertices[3] = parse(line)
        elif (i == 2068):
            vertices[4] = parse(line)
        elif (i == 2077):
            vertices[5] = parse(line)
        elif (i == 2078):
            vertices[6] = parse(line)

x_sum = 0
y_sum = 0
z_sum = 0
for i in range(1, 7):
    point = vertices[i]
    x_sum += point[0]
    y_sum += point[1]
    z_sum += point[2]

centroid = [x_sum / 6, y_sum / 6, z_sum / 6]
print(centroid)

bottom_point = vertices[6]
top_point = vertices[3]
direction = [top_point[i] - bottom_point[i] for i in range(3)]
print(direction)
print(normalize(direction))


bottom_line_point = [centroid[i] - 5 * direction[i] for i in range(3)]
top_line_point = [centroid[i] + 5 * direction[i] for i in range(3)]

print(bottom_line_point)
print(top_line_point)

print("\n\n\n")
for i in range(1, 7):
    print(vertices[i])