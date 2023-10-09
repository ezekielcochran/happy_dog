#!/usr/local/bin/python

# This script serves to find tail polygons by listing all vertices that are included
# in tail polygons that were already found.

lines_to_check = []
with open("dog_triangles_separated.js", "r") as f:
    lines = f.readlines()
    i = 0
    for line in lines:
        i += 1
        if i >= 2045 and "vec4" in line:
            lines_to_check.append(line)

target_lines = set()
with open("dog_triangles_separated.js", "r") as f:
    lines = f.readlines()
    i = 0
    for line in lines:
        i += 1
        for target in lines_to_check:
            if target == line and i < 2000:
                print("Line {}: Found {}.".format(i, target))
                target_lines.add(i)

print(sorted(list(target_lines)))