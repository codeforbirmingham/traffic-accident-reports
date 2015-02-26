#!/usr/bin/env python3

############################################################################
#
# File: GeocodeData.py
# Last Edit: 2015-02-26
# Author: Matthew Leeds <mwl458@gmail.com>
# Contributor: Alexander Grüneberg <alexander.grueneberg@googlemail.com>
# Purpose: This script reads in traffic accident data provided by the
# the City of Birmingham in CSV format, cleans up the data a bit, and
# makes geocoding requests to Google's API.
# Usage: Just make sure the file names are accurate and replace the 
# GOOGLE_API_KEY variable with your own from 
# https://code.google.com/apis/console (and make sure to allow your current
# public IP address from that console). Then run 'python3 GeocodeData.py'.
#
############################################################################


import csv
import json
from urllib.request import urlopen
from urllib.parse import urlencode
from time import sleep

INFILE = 'Bham_Traffic_Accidents_2014.csv'
OUTFILE = 'Bham_Geocodings_2014.json'
GOOGLE_BASE_URL = 'https://maps.googleapis.com/maps/api/geocode/json?'
GOOGLE_API_KEY = 'YOUR_API_KEY' # Google API key
MAX_API_REQUESTS = 2500 # per day
# an estimated minimum bounding rectangle around Alabama formatted for Google
ALABAMA_BOUNDS = '35.046674,-88.751659|30.077183,-84.687088'
CITY_STATE = 'Birmingham, AL' # appended to the address for geocoding


def main():
    global overAPILimit
    overAPILimit = False
    allGeocodings = {}
    # Load data from a previous run if it exists
    try:
        with open(OUTFILE) as f:
            allGeocodings = json.load(f)
    except FileNotFoundError as e:
        pass
    # first grab all the unique locations in the data
    uniqueLocations = []
    print('>> Reading data from ' + INFILE)
    with open(INFILE) as f:
        c = csv.reader(f)
        for i, record in enumerate(c):
            if i == 0:
                headers = record
            else:
                location = record[headers.index('Location')]
                # drop missing values and non-intersection-related accidents
                if not ('NO DESCRIPTION AVAILABLE' in location or location.startswith('Between ')):
                    uniqueLocations.append(location)
    uniqueLocations = list(set(uniqueLocations)) # remove duplicates
    print('>> Identified ' + str(len(uniqueLocations)) + ' unique locations.')
    # Now process the data
    print('>> Making geocoding requests to Google...')
    numSuccess = 0
    numFailure = 0
    numAPIRequests = 0
    for location in uniqueLocations:
        # don't bother if we have the data from a previous run
        if location in allGeocodings:
            continue
        # check if we're over the request limit
        numAPIRequests += 1
        if numAPIRequests >= MAX_API_REQUESTS or overAPILimit:
            print('>> Error: Exceeded API Usage limits. Try again in 24 hours.')
            break
        result = process(location)
        if len(result) > 0:
            allGeocodings[location] = result
            numSuccess += 1
        else:
            numFailure += 1
    print('>> Complete. Successes = ' + str(numSuccess) + ', Failures = ' + str(numFailure)) 
    # Now write the data out to a file
    print('>> Writing geocodings to ' + OUTFILE)
    with open(OUTFILE, 'w') as f:
        json.dump(allGeocodings, f, sort_keys=True, indent=4, separators=(',', ': '))

# This takes an intersection in the format 'ROAD/HWY at ROAD/HWY',
# cleans it up and makes the request.
# on success: returns '(lat, long)'
# on failure: returns ''
def process(location):
    location += ' ' + CITY_STATE
    try:
        response = geocodeGoogle(location)
    except Exception as e:
        print('Caught Error:\n' + str(e))
        return ''
    if response[0] != '(':
        print('>> Error ' + response + ": " + location)
        if response == 'REQUEST_DENIED' or response == 'OVER_QUERY_LIMIT':
            overAPILimit = True
        return ''
    return response

# uses the Google Maps API to geocode an address
# on success: returns '(lat, lng)'
# on failure: returns the status code (a string)
def geocodeGoogle(address):
    # the bounds parameter biases results to locations within Alabama
    params = {'address': address, 
              'bounds': ALABAMA_BOUNDS,
              'key': GOOGLE_API_KEY}
    url = GOOGLE_BASE_URL + urlencode(params, safe='/,|')
    rawreply = urlopen(url).read()
    reply = json.loads(rawreply.decode('utf-8'))
    sleep(0.1) # stay under usage limit
    if reply['status'] == 'OK':
        # assume the first result is correct, but only include intersections
        if 'intersection' in reply['results'][0]['types']:
            # round to 6 decimal places (~0.1m precision)
            return '(' + str(round(reply['results'][0]['geometry']['location']['lat'], 6)) + ', ' + \
                         str(round(reply['results'][0]['geometry']['location']['lng'], 6)) + ')'
        else:
            return 'NOT_AN_INTERSECTION'
    else:
        return reply['status']

if __name__=='__main__':
    main()
