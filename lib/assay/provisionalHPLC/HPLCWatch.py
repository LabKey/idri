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
# Depdenencies can normally be installed using the pip package manager (e.g. $> pip install requests)

import sys, time, os, threading
import requests
import logging

from datetime import datetime
from watchdog.observers import Observer
from watchdog.events import PatternMatchingEventHandler

server       = '' # required, leave off any http(s):// and include any ports (e.g. :8000)
target_dir   = '' # required
user         = '' # required
password     = '' # required
context_path = '' # optional

filepatterns = ["*.txt", "*.csv"]
sleep_interval = 60
success_interval = 60

class HPLCHandler(PatternMatchingEventHandler):

    def __init__(self, patterns=filepatterns):
        super(HPLCHandler, self).__init__(patterns=patterns)
        self.pipelinePath = self.requestPipeline() 
        self.successTimerDelay = success_interval # time in seconds
        self.runFiles = []

        #
        # Initialize the run task    
        #
        self.checkTask = 0

    def on_created(self, event):
        super(HPLCHandler, self).on_any_event(event)
        self.handleUpload(event)

    # def on_modified(self, event):
    #     super(HPLCHandler, self).on_created(event)

    # def on_deleted(self, event):
    #     super(HPLCHandler, self).on_deleted(event)
    #     print "File has been deleted"

    def handleUpload(self, event):        
        if event.is_directory == False and len(event.src_path) > 0:
            split_path = event.src_path.split("\\") # should check / or \
            if (len(split_path) > 0):
                name = str(split_path[len(split_path)-1])                
                if name.find('~') == -1:
                    logging.info("Preparing to send " + name)
                    files = {'file' : (name, open(name, 'rb'))}
                    self.addRunFile(files)
                    url = 'http://' + server + self.pipelinePath + '/' #self.buildURL(server, context_path, target_dir)
                    r = requests.post(url, files=files, auth=(user, password))
                    s = r.status_code
                    if s == 207 or s == 200:
                        logging.info(str(s), " Uploaded Successfully: " + name)
                        print s, "Uploaded Successfully:", name
                    elif s == 401:
                        logging.error(str(s) + " Authentication failed. Check user and password.")
                        print s, "Authentication failed. Check user and password."
                    elif s == 404:
                        logging.error(str(s) + " Location not found. URL: " + url)
                        print s, "Location not found. URL:", url
                    else:
                        logging.error(str(s) + " Failed: " + name)
                        print s, "Failed:", name

    def getBaseURL(self, context):
        ctx = '/' + context + '/' if len(context) > 0 else ''
        return 'http://' + server + '/' + context

    def buildURL(self, server, context, target):
        return self.getBaseURL(context) + '/' + target + '/'

    def buildActionURL(self, controller, action):
        return self.getBaseURL(context_path) + '/' + controller + '/' + target_dir + '/' + action + '.api'

    def requestPipeline(self):
        actionURL = self.buildActionURL('idri', 'getHPLCPipelineContainer')
        logging.info("...Requesting Pipeline Configuration")
        r = requests.get(actionURL, auth=(user, password))
        logging.info("...done. Status: " + str(r.status_code))

        if r.status_code == 200:
            pipe = r.json()['webDavURL']
            logging.info("Pipeline Path: " + pipe)
            return pipe
        else:
            msg = "\nUnable to process pipeline configuration.\n" + str(r.status_code) + ": " + actionURL
            msg += "\nCheck that this URL resolves and/or the IDRI module is properly installed on the server."

            logging.error(msg)
            raise Exception(msg)

    def addRunFile(self, fileJSON):
        if len(self.runFiles) == 0:
            print "Starting new run"
        self.runFiles.append(fileJSON)
        self.reset()

    def reset(self):
        if self.checkTask != 0:
            self.checkTask.cancel()
        self.checkTask = self.getCheckTask()
        self.checkTask.start()

    def getCheckTask(self):
        return threading.Timer(self.successTimerDelay, self.runOver)

    def runOver(self):
        print "The current run is over, no other files were uploaded"
        print str(self.runFiles)
        self.runFiles = []
        self.checkTask = 0

        
if __name__ == "__main__":

    #
    # Configure Logging
    #
    logging.basicConfig(filename='watch.log', level=logging.DEBUG)
    logging.info('\n\n\nStarting HPLCWatch: ' + str(datetime.now()))

    #
    # Configure path being watched
    #
    path = "."
    if len(sys.argv) > 1:
        path = sys.argv[1]
    else:
        path = os.path.abspath(path)

    logging.info(" Watching: " + path)
    logging.info(" File Matchers: " + str(filepatterns))
    logging.info(" sleep_interval: " + str(sleep_interval))

    #
    # Start observing the configured path
    #
    obs = Observer()
    obs.schedule(HPLCHandler(), path=path, recursive=True)
    obs.start()

    #
    # Let the command line user know it is responding
    #
    print "Configuration complete. Listening in", path

    try:
        while True:
            time.sleep(sleep_interval)
    except KeyboardInterrupt:
        obs.stop()
    obs.join()
