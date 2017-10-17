#
# Copyright (c) 2015-2017 LabKey Corporation
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
# Company: LabKey
# Date:    1.15.2013
# File:    HPLCWatch.py
# Purpose: This script is intended for use in watching and uploading HPLC files in the LabKey HPLC assay.
#          This script should be placed in the directory that is to be watched. As files are modified they
#          will be interrogated and uploaded to the server drop point.
# Built:   Python 3.6.3
# Dependencies:
#   requests : http://docs.python-requests.org/en/latest/
#   watchdog : http://packages.python.org/watchdog/
# Dependencies can normally be installed using the pip package manager (e.g. $> pip install requests)

import sys, time, os, threading, shutil
import requests
import logging
import json

from datetime import datetime
from watchdog.observers import Observer
from watchdog.events import PatternMatchingEventHandler

from labkey.utils import create_server_context

server = ''  # required, leave off any http(s):// and include any ports (e.g. :8000)
target_dir = ''  # required
use_ssl = True
context_path = ''
archive_dir = 'archive'
drop_dir = 'drop'

file_patterns = ["*.txt", "*.csv", "*.tsv", "*.SEQ"]
sleep_interval = 60
success_interval = 60
machine_name = ''
END_RUN_PREFIX = 'POST'

# OS delimiter
delimiter = '/'
if sys.platform == "win32":
    delimiter = "\\"

# create the server context to be used for the lifetime of this watch
server_ctx = create_server_context(server, target_dir, context_path=context_path, use_ssl=use_ssl)

handler = None
drop_path = None
obs = None


def start_observer():
    logging.info("Starting observer")
    obs = Observer()
    obs.schedule(HPLCHandler(), path=drop_path, recursive=False)
    obs.start()


def stop_observer():
    logging.info("Stopping observer")
    if obs is not None:
        obs.stop()
        obs.join()


class HPLCHandler(PatternMatchingEventHandler):

    def __init__(self, patterns=file_patterns):
        super(HPLCHandler, self).__init__(patterns=patterns, ignore_directories=True)

        try:
            self.assayId = self.request_assay()
            self.pipelinePath = self.request_pipeline()
        except requests.exceptions.SSLError:
            logging.exception("The current SSL mode: \'" + str(use_ssl) + "\' does not match the server configuration.")
            raise Exception("Failed to configure SSL properly. See watch.log")
        except Exception as e:
            logging.exception("Failed configuration.")
            raise Exception(str(e))

        self.successTimerDelay = success_interval  # time in seconds
        self.runFiles = []
        self.runFilesMap = {}
        self.folder = ""
        self.observer = None

        #
        # Initialize the run task
        #
        self.checkTask = 0

    def on_created(self, event):
        super(HPLCHandler, self).on_created(event)
        self.handle_file_event(event)

    def on_deleted(self, event):
        super(HPLCHandler, self).on_deleted(event)
        self.handle_file_event(event, True)

    def handle_file_event(self, event, is_delete=False):
        if event.is_directory == False and len(event.src_path) > 0:
            split_path = event.src_path.split("\\")  # should check / or \
            if len(split_path) > 0:
                name = str(split_path[len(split_path)-1])
                if name.find('~') == -1:
                    if is_delete:
                        self.remove_run_file(name)
                    else:
                        logging.info(" Adding file to run: " + name)
                        files = {'file': name}
                        self.add_run_file(name, files)

    def upload(self, file_json, folder):
        logging.info(" Preparing to send...")

        url = server_ctx._scheme + server + self.pipelinePath + '/' + folder + '/'
        name = file_json['file']

        #
        # Attempt to open the file
        #
        _file = open(os.getcwd() + delimiter + drop_dir + delimiter + name, 'rb')
        payload = {'file': (name, _file)}

        try:
            r = server_ctx._session.post(url, files=payload)
            s = r.status_code
            if s == 207 or s == 200:
                logging.info(" " + str(s) + " Uploaded Successfully: " + name)
                print(s, "Uploaded Successfully:", name)
            elif s == 401:
                logging.error(" " + str(s) + " Authentication failed. Check user and password.")
                print(s, "Authentication failed. Check user and password.")
            elif s == 404:
                logging.error(" " + str(s) + " Location not found. URL: " + url)
                print(s, "Location not found. URL:", url)
            else:
                logging.error(" " + str(s) + " Failed: " + name)
                print(s, "Failed:", name)
        except requests.exceptions.SSLError as e:
            logging.exception("The current SSL mode: \'" + str(use_ssl) + "\' does not match the server configuration.")
            raise Exception("Failed to match server SSL configuration. Upload Failed. See watch.log")
        except Exception as e:
            logging.exception("Failed upload. See watch.log")
            raise Exception(str(e))

        #
        # Ensure that the resource is closed so files can be moved/deleted
        #
        _file.close()

    def get_data_file_url(self, file_json, folder):
        logging.info(" Requesting file data...")

        file_name = file_json['file']

        #
        # Account for context path since server does recognize on WebDAV path
        #
        sub_pipeline_path = self.pipelinePath
        if len(context_path) > 0:
            sub_pipeline_path = self.pipelinePath.replace('/' + context_path, '')

        dav_path = sub_pipeline_path + '/' + folder + '/' + file_name
        url = server_ctx.build_url('idri', 'getHPLCResource.api') + '?path=' + dav_path

        r = server_ctx._session.get(url)
        s = r.status_code
        if s == 200:
            decoded = json.JSONDecoder().decode(r.text)
            return decoded[u'DataFileUrl']

        logging.info("...done")

    @staticmethod
    def request_assay():
        assay_url = server_ctx.build_url('assay', 'assayList.api')
        logging.info("...Requesting Assay Metadata")

        payload = {'type': "Provisional HPLC"}
        headers = {'Content-type': 'application/json', 'Accept': 'text/plain'}

        try:
            decoded = server_ctx.make_request(assay_url, json.dumps(payload), headers=headers)
            definitions = decoded[u'definitions']
            if len(definitions) != 1:
                msg = "Unable to determine target Assay. Ensure there is one and only one 'Provisional HPLC' " \
                      "assay present."
                logging.error(msg)
                raise Exception(msg)

            #
            # Get the definition ID
            #
            logging.info('Done. AssayID: ' + str(definitions[0][u'id']))
            return definitions[0][u'id']
        except Exception as e:
            msg = "Unable to determine target Assay."
            logging.error(msg)
            raise Exception(msg)

    @staticmethod
    def request_pipeline():
        action_url = server_ctx.build_url('idri', 'getHPLCPipelineContainer.api')
        logging.info("...Requesting Pipeline Configuration")

        try:
            decoded = server_ctx.make_request(action_url, None, method='GET')
            logging.info("...done.")
            pipe = decoded[u'webDavURL']
            logging.info(" Pipeline Path: " + pipe)
            return pipe
        except Exception as e:
            msg = "\nUnable to process pipeline configuration.\n" + str(e) + ": " + action_url
            msg += "\nCheck that this URL resolves and/or the IDRI module is properly installed on the server."

            logging.error(msg)
            raise Exception(msg)

    def add_run_file(self, file_name, file_json):
        if len(self.runFiles) == 0:
            print("Starting new run", file_name, file_json)

        self.runFiles.append(file_json)
        self.runFilesMap[file_name] = len(self.runFiles) - 1

        end_run = self.is_end_run(file_name)
        self.reset(end_run)
        if end_run:
            #
            # The end of the run as been established
            #
            self.run_over()

    def remove_run_file(self, file_name):
        index = self.runFilesMap.get(file_name)
        if index:
            if len(self.runFiles) > index:
                #
                # The file was found, remove it
                #
                logging.info(" Remove file from run: " + file_name)
                del self.runFiles[index]
            else:
                logging.info(" Index out of sync for: " + file_name)
            self.runFilesMap.pop(file_name)

    @staticmethod
    def is_end_run(file_name):
        return file_name.find(END_RUN_PREFIX) == 0

    def reset(self, end_run):
        if self.checkTask != 0:
            self.checkTask.cancel()
        if not end_run:
            self.checkTask = self.get_check_task()
            self.checkTask.start()

    def get_check_task(self):
        return threading.Timer(self.successTimerDelay, self.run_over)

    def run_over(self):
        logging.info("...Current run is over, no other files were uploaded. Attempting to push run to server...")
        stop_observer()

        #
        # Create a unique folder in the pipeline for upload
        #
        self.folder = self.generate_folder_name()
        folderURL = server_ctx._scheme + server + self.pipelinePath + '/' + self.folder

        r = server_ctx._session.request('MKCOL', folderURL)
        s = r.status_code

        if s == 201:
            logging.info(" Created folder (" + self.folder + ")")
            print("Folder Created:", self.folder)

            #
            # Iterate over each file in the current run and upload to server
            #
            for f in self.runFiles:
                self.upload(f, self.folder)

            #
            # Move all files into a run folder
            #
            cwd = os.getcwd()
            drop_path = cwd + delimiter + drop_dir
            archive_folder = cwd + delimiter + archive_dir + delimiter + self.folder

            logging.info("Archive destination: " + archive_folder)
            print("Archive destination", archive_folder)
            shutil.move(drop_path, archive_folder)
            os.mkdir(drop_path)

            #
            # Now iterate over each file and determine the dataFileURL
            #
            run_files = []  # deep copy
            for i in range(len(self.runFiles)):
                run_files.append(self.runFiles[i])

            for rf in run_files:
                rf['DataFileUrl'] = self.get_data_file_url(rf, self.folder)

            self.runFiles = run_files
            print("Found Data File URLs...")

            #
            # Files are fully processed, now update run information in Assay
            #
            hplc_run = self.create_hplc_run()
            hplc_run.save(server_ctx.build_url('assay', 'saveAssayBatch.api'))

            logging.info("...done")
        else:
            logging.error(" Failed to created folder (" + self.folder + ") in " + folderURL)
            print("Failed to create folder on server:", self.folder, s)

        self.runFiles = []
        self.runFilesMap = {}
        self.checkTask = 0
        self.folder = ""
        start_observer()

        print("Preparation for next run complete.")

    @staticmethod
    def generate_folder_name():
        lt = time.localtime()
        name = ""
        sep = ""
        for tm in lt[0:6]: # from year to second
            name += sep + str(tm)
            sep = "_"

        print(name)
        return name

    def create_hplc_run(self):
        hplc_run = HPLCRun(self.assayId)

        #
        # Prepare run level information
        #
        hplc_run.set_run_identifier(self.folder)
        hplc_run.set_machine_name(machine_name)

        #
        # Prepare result level information
        #
        dataRows = []
        dataInputs = []
        for runFile in self.runFiles:
            fName = runFile['file']
            data = {"Name": fName, "DataFile": fName, "TestType": "SMP"}
            dataRows.append(data)

            f = runFile['DataFileUrl']
            data = {"dataFileURL": f, "name": fName}
            dataInputs.append(data)

        hplc_run.set_result(dataRows)
        hplc_run.set_data_inputs(dataInputs)

        return hplc_run


# TODO: Information to pull from file:
#   - Result name
#   - Result type (SMP or STD)
#
#
class HPLCRun:

    def __init__(self, assay_id):
        self.assayId = assay_id
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

    def save(self, save_url):
        print("Saving HPLC Run...")

        #
        # This is the only run in this batch
        #
        me = {
            'name': self.name,
            'properties': self.properties,
            'dataRows': self.dataRows,
            'dataInputs': self.dataInputs
        }

        batch = {'batchProtocolId': self.assayId, 'runs': [me]}
        payload = {'assayId': self.assayId, 'batch': batch}
        headers = {'Content-type': 'application/json', 'Accept': 'text/plain'}

        try:
            server_ctx.make_request(save_url, json.dumps(payload), headers=headers)
            logging.info("Run saved successfully.")
            print("Run saved Successfully.")
        except Exception as e:
            logging.exception(str(e))

    def add_result(self, result_row):
        self.dataRows.append(result_row)

    def set_result(self, result_rows):
        self.dataRows = result_rows

    def set_machine_name(self, machine):
        self.properties["Machine"] = machine

    def set_run_identifier(self, identifier):
        self.name = identifier
        self.properties["RunIdentifier"] = identifier

    def set_data_inputs(self, data_inputs):
        self.dataInputs = data_inputs


class HPLCAssay:

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
    logging.basicConfig(level=logging.DEBUG,
                        filename='watch.log',
                        format='%(asctime)s %(levelname)s: %(message)s',
                        datefmt='%Y-%m-%d %H:%M:%S')
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

    #
    # Prepare drop/archive directories
    #
    drop_path = path + delimiter + drop_dir
    archive_path = path + delimiter + archive_dir

    if os.path.isdir(drop_path):
        shutil.rmtree(drop_path)
    os.mkdir(drop_path)

    if not os.path.isdir(archive_path):
        os.mkdir(archive_path)

    logging.info(" Watching: " + drop_path)
    logging.info(" File Matchers: " + str(file_patterns))
    logging.info(" sleep_interval: " + str(sleep_interval))

    #
    # Start observing the configured drop path
    #
    handler = HPLCHandler()
    start_observer()

    #
    # Let the command line user know it is responding
    #
    print("Configuration complete. Listening in", drop_path)

    try:
        while True:
            time.sleep(sleep_interval)
    except KeyboardInterrupt:
        logging.info(" Keyboard Interrupt: Expected from User.")
        stop_observer()
