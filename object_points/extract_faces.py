#!/usr/local/bin/python

import math

inputFile = open("Golden Retriever figure_obj.obj", "r")

lines = inputFile.readlines()

# scales all the points down into the [-1, 1]^3 coordinate space
def scale(points):
	max_x, max_y, max_z = points[0]
	min_x, min_y, min_z = points[0]
	
	for [x, y, z] in points:
		
		if x > max_x:
			max_x = x
		elif x < min_x:
			min_x = x
		
		if y > max_y:
			max_y = y
		elif y < min_y:
			min_y = y

		if z > max_z:
			max_z = z
		elif z < min_z:
			min_z = z
	
	len_x = max_x - min_x
	len_y = max_y - min_y
	len_z = max_z - min_z
	len_biggest = max(len_x, len_y, len_z)
	x_padding = (len_biggest - len_x) / 2
	y_padding = (len_biggest - len_y) / 2
	z_padding = (len_biggest - len_z) / 2

	x_lower, x_upper = min_x - x_padding, max_x + x_padding
	y_lower, y_upper = min_y - y_padding, max_y + y_padding
	z_lower, z_upper = min_z - z_padding, max_z + z_padding

	ax = 2 / (x_upper - x_lower)
	bx = 1 - ax * x_upper

	ay = 2 / (y_upper - y_lower)
	by = 1 - ay * y_upper

	az = 2 / (z_upper - z_lower)
	bz = 1 - az * z_upper

	# scale everything down by sqrt(2) so that it stays visible when rotated
	[ax, bx, ay, by, az, bz] = [x / math.sqrt(2) for x in [ax, bx, ay, by, az, bz]]

	for i in range(len(points)):
		point = points[i]
		# points[i] = [ax * point[0] + bx, ay * point[1] + by, az * point[2] + bz]
		points[i] = [ax * point[0] + bx, ay * point[1] + by, az * point[2] + bz]


points = []
faces = []
for line in lines:
	words = line.split()
	if (words[0] == "v"):
		points.append([float(n) for n in words[1:]])
	if (words[0] == "f"):
		vertices = [int(x.split('/')[0]) for x in words[1:]]
		faces.append(vertices)

scale(points)

triangles = []
for face in faces:
	for i in range(1, len(face) - 1):
		# we add the -1 becuase points in the .obj file are indexed starting from 1
		triangles.append([points[face[0] - 1], points[face[i] - 1], points[face[i + 1] - 1]])


output_file = open("dog_triangles.js", "w")
output_file.write("var numPoints = {}\n\n".format(len(triangles) * 3))
output_file.write("var vertices = [\n")
for triangle in triangles:
	# print(triangle)
	for vertex in triangle:
		output_file.write("\tvec4({}, {}, {}, 1.0),\n".format(vertex[0], vertex[1], vertex[2]))
output_file.write("]")



