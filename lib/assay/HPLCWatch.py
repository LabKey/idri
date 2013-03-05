#
# Copyright (c) 2013 LabKey Corporation
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

# Author:  Nick Arnold
# Company: LabKey Software
# Date:    1.15.2013
# File:    HPLCWatch.py
# Purpose: This script is intended for use in watching and uploading HPLC files in the LabKey HPLC assay.
#          This script should be placed in the directory that is to be watched. As files are modified they
#          will be interrogated and uploaded to the server drop point.
# Built:   Python 2.7.3
# Depedendencies:
#   requests : http://docs.python-requests.org/en/latest/
#   watchdog : http://packages.python.org/watchdog/

import sys, time, os
import requests

from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from watchdog.events import LoggingEventHandler
from watchdog.events import PatternMatchingEventHandler

server       = '' # required
target_dir   = '' # required
user         = '' # required
password     = '' # required

context_path = ''
filepatterns = ["*.txt", "*.csv"]

class HPLCHandler(PatternMatchingEventHandler):

    def __init__(self, patterns=filepatterns):
        super(HPLCHandler, self).__init__(patterns=patterns)
                        
    def on_modified(self, event):
        super(HPLCHandler, self).on_modified(event)
        self.handleUpload(event)

    def handleUpload(self, event):        
        if event.is_directory == False and len(event.src_path) > 0:
            split_path = event.src_path.split("\\") # should check / or \
            if (len(split_path) > 0):
                name = str(split_path[len(split_path)-1])                
                if name.find('~') == -1:
                    print name
                    time.sleep(60)
                    files = {'file' : (name, open(name, 'rb'))}
                    url = self.buildURL(server, context_path, target_dir)
                    r = requests.post(url, files=files, auth=(user, password))
                    s = r.status_code
                    if s == 207 or s == 200:
                        print name, "Uploaded Successfully."
                    elif s == 401:
                        print "Authentication failed. Check user and password."
                    elif s == 404:
                        print "Location not found. URL:", url
                    else:
                        print name, "Failed:", s

    def buildURL(self, server, context, target):
        ctx = '/' + context + '/' if len(context) > 0 else ''
        return 'http://' + server + '/' + context + '/' + target + '/'

        
if __name__ == "__main__":
    path = "."
    if len(sys.argv) > 1:
        path = sys.argv[1]

    obs = Observer()
    print "Watching", path

    obs.schedule(HPLCHandler(), path=path, recursive=True)
    obs.start()
    try:
        while True:
            time.sleep(60)
    except KeyboardInterrupt:
        obs.stop()
    obs.join()
