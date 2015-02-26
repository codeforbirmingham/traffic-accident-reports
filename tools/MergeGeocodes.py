#!/usr/bin/env python3

############################################################################
#
# File: MergeGeocodes.py
# Last Edit: 2015-02-26
# Author: Alexander Grüneberg <alexander.grueneberg@googlemail.com>
# Purpose: Merge geocoded locations with original CSV input file.
#
############################################################################


import csv
import json

CSVFILE = 'Bham_Traffic_Accidents_2014.csv'
GEOFILE = 'Bham_Geocodings_2014.json'
OUTFILE = 'Bham_Traffic_Accidents_2014_merged.csv'


def main():
    # load geocoded data
    geocodes = {}
    print('>> Reading geocoded data from ' + GEOFILE)
    with open(GEOFILE) as f:
        geocodes = json.load(f)
    # load csv file
    print('>> Reading CSV data from ' + CSVFILE)
    with open(OUTFILE, 'w') as outfile:
        writer = csv.writer(outfile)
        with open(CSVFILE) as csvfile:
            c = csv.reader(csvfile)
            for i, record in enumerate(c):
                if i == 0:
                    headers = record
                    headers.append('Latitude')
                    headers.append('Longitude')
                    writer.writerow(headers)
                else:
                    location = record[headers.index('Location')]
                    if location in geocodes:
                        coordinates = geocodes[location].strip('()').split(', ')
                    else:
                        coordinates = ['', '']
                    line = record
                    line.append(coordinates[0])
                    line.append(coordinates[1])
                    writer.writerow(line)
    print('>> Complete, see ' + OUTFILE)


if __name__=='__main__':
    main()
