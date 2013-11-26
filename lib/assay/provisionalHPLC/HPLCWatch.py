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

import sys, time, os, threading, shutil
import requests
import logging
import json

from datetime import datetime
from watchdog.observers import Observer
from watchdog.events import PatternMatchingEventHandler

server       = '' # required, leave off any http(s):// and include any ports (e.g. :8000)
target_dir   = '' # required
user         = '' # required
password     = '' # required
context_path = '' # optional

filepatterns = ["*.txt", "*.csv", "*.tsv"]
sleep_interval = 60
success_interval = 60
machine_name = ''

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
        self.handleFileEvent(event)

    # def on_modified(self, event):
    #     super(HPLCHandler, self).on_created(event)

    # def on_deleted(self, event):
    #     super(HPLCHandler, self).on_deleted(event)
    #     print "File has been deleted"

    def handleFileEvent(self, event):        
        if event.is_directory == False and len(event.src_path) > 0:
            split_path = event.src_path.split("\\") # should check / or \
            if (len(split_path) > 0):
                name = str(split_path[len(split_path)-1])                
                if name.find('~') == -1:  
                    logging.info(" Adding file to run: " + name)
                    files = {'file' : (name, open(name, 'rb'))}
                    self.addRunFile(files)                    

    def upload(self, fileJSON, folder):
        logging.info(" Preparing to send...")    
        url = 'http://' + server + self.pipelinePath + '/' + folder + '/' #self.buildURL(server, context_path, target_dir)
        name = fileJSON['file'][0]
        r = requests.post(url, files=fileJSON, auth=(user, password))
        s = r.status_code
        if s == 207 or s == 200:
            logging.info(" " + str(s) + " Uploaded Successfully: " + name)
            print s, "Uploaded Successfully:", name
        elif s == 401:
            logging.error(" " + str(s) + " Authentication failed. Check user and password.")
            print s, "Authentication failed. Check user and password."
        elif s == 404:
            logging.error(" " + str(s) + " Location not found. URL: " + url)
            print s, "Location not found. URL:", url
        else:
            logging.error(" " + str(s) + " Failed: " + name)
            print s, "Failed:", name   

        #
        # Ensure that the resource is closed so files can be moved/deleted
        #
        _file = fileJSON['file'][1]
        _file.close()     

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
            logging.info(" Pipeline Path: " + pipe)
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
        logging.info("...Current run is over, no other files were uploaded. Attempting to push run to server...")

        #
        # Create a unique folder in the pipeline for upload
        #
        self.folder = self.generateFolderName()
        folderURL = 'http://' + server + self.pipelinePath + '/' + self.folder
        r = requests.request('MKCOL', folderURL, auth=(user, password))
        s = r.status_code

        if s == 201:
            logging.info(" Created folder (" + self.folder + ")")
            print "Folder Created:", self.folder

            #
            # Iterate over each file in the current run and upload to server
            #
            for f in self.runFiles:
                self.upload(f, self.folder)

            logging.info("...done");
        else:
            logging.error(" Failed to created folder (" + self.folder + ") in " + folderURL)
            print "Failed to create folder:", self.folder

        #
        # Move all files into a run folder
        #
        os.mkdir(self.folder)
        cwd = os.getcwd()
        
        #
        # OS delimiter
        #
        delmiter = '/'
        if sys.platform == "win32":
            delimiter = "\\"

        destPath = cwd + delimiter + self.folder + delimiter
        print "Destination:", destPath

        for f in self.runFiles:
            fileName = f['file'][0]
            dest = destPath + fileName
            source = cwd + delimiter + fileName
            print "Source:", source
            shutil.move(source, dest)

        #
        # Files are fully processed, now update run information in Assay
        #
        hplcRun = self.createHPLCRun()

        saveURL = self.buildActionURL('assay', 'saveAssayBatch')

        hplcRun.save(saveURL)

        self.runFiles = []
        self.checkTask = 0
        self.folder = ""

    def generateFolderName(self):
        lt = time.localtime()
        name = ""
        sep = ""
        for tm in lt[0:6]: # from year to second
            name += sep + str(tm)
            sep = "_"

        print name      
        return name

    def createHPLCRun(self):
        hplcRun = HPLCRun()

        #
        # Prepare run level information
        #
        hplcRun.setRunIdentifier(self.folder)
        hplcRun.setMachineName(machine_name)

        #
        # Prepare result level information
        #
        dataRows = []
        for runFile in self.runFiles:
            f = runFile['file'][0]
            data = {"Name": f, "DataFile": f, "TestType": "SMP"}
            dataRows.append(data)

        hplcRun.setResult(dataRows)

        return hplcRun

# TODO: Information to pull from file:
#   - Result name
#   - Result type (SMP or STD)
#
#
class HPLCRun():
    
    def __init__(self):
        self.comment = None
        self.created = None
        self.createdBy = None
        self.dataInputs = []
        self.dataOutputs = []
        self.dataRows = []
        self.experiments = []
        self.filePathRoot = None
        self.id = None
        self.lsid = None
        self.materialInputs = []
        self.materialOutputs = []
        self.modified = None
        self.modifiedBy = None
        self.name = None
        self.objectProperties = {}
        self.properties = {"Published": False}
        self.protocol = None
        self.rowId = None

    def save(self, saveURL):
        print "Saving HPLC Run...", saveURL
        payload = {}
        payload['assayId'] = 112 # TODO: Get this from Assay object

        batch = {'batchProtocolId': 112}

        #
        # This is the only run in this batch
        #
        me = {"name": self.name}
        me["properties"] = self.properties
        me["dataRows"] = self.dataRows

        batch['runs'] = [me]
        payload['batch'] = batch

        headers = {'Content-type': 'application/json', 'Accept': 'text/plain'}
        r = requests.post(saveURL, data=json.dumps(payload), headers=headers, auth=(user, password))
        s = r.status_code

        if s == 400:
            print r.status_code, "Bad Request"
            print r.text
            print r.json



    def addResult(self, resultRow):
        self.dataRows.append(resultRow)

    def setResult(self, resultRows):
        self.dataRows = resultRows

    def setMachineName(self, machineName):
        self.properties["Machine"] = machineName

    def setRunIdentifier(self, identifier):
        self.name = identifier
        self.properties["RunIdentifier"] = identifier

class HPLCAssay():

    def __init__(self):
        self.containerPath = None
        self.description = None
        self.domains = {}
        self.id = None
        self.importAction = None
        self.importController = None
        self.name = None
        self.projectLevel = True
        self.protocolSchemaName = None
        self.type = None    

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

    os.chdir(path)

    logging.info(" Watching: " + path)
    logging.info(" File Matchers: " + str(filepatterns))
    logging.info(" sleep_interval: " + str(sleep_interval))

    #
    # Start observing the configured path
    #
    obs = Observer()
    obs.schedule(HPLCHandler(), path=path, recursive=False)
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
