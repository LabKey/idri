##
#  Copyright (c) 2012 LabKey Corporation
# 
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
# 
#      http://www.apache.org/licenses/LICENSE-2.0
# 
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
##
#XY Data Plotter
#Quinton Dowling | IDRI
#10 October 2012

#Description: This script will detect delimiter based on filename, and if
#that fails it will try to detect the delimiter automatically from the
#data.
#-----------------------------INITIATE-----------------------------------#
#libraries
library(Rlabkey)

#Set debugvar to TRUE for verbose script
debugvar <- FALSE

#File path
fileParam   <- labkey.url.params$file
filePath    <- paste(labkey.file.root, fileParam, sep="")

#test filename for delimiter information (.csv, .txt)
#csv
if(length(grep (".csv", ignore.case = TRUE, filePath))){
	type <- "csv"
	delim <- ","
	if(debugvar==TRUE){print (type)}
#tab delim
}else{if (length(grep (".txt", ignore.case = TRUE, filePath))){
	type <- "txt"
	delim <- "\t"
	if(debugvar==TRUE){print (type)}
#unknown delimiter
}else{
	type <- "unknown"
	if(debugvar==TRUE){print (type)}}
}

#-----------------------------READ DATA----------------------------------#
#try reading data
spec <- read.table (filePath, header = FALSE, sep = delim)

#check that the data loaded correctly
if(ncol(spec)!=2){
	error<-TRUE
}else{error<-FALSE}
if(debugvar==TRUE){print(paste("Error:", error))}

#if the data did not load correctly try to figure out the delimiter
if(error==TRUE){
	delimopt <- grep('[^1234567890]', strsplit(as.vector(spec[1,]), "")[[1]], value = TRUE)
	delim <- grep('[^.]', delimopt, value = TRUE)
	#try again...
	spec <- read.table (filePath, header = FALSE, sep = delim)
	#check that the data loaded correctly
	if(ncol(data)!=2){
		error<-TRUE
	}else{error<-FALSE}
	if(debugvar){print(paste("Error:", error))}
}

#-----------------------------PLOT DATA----------------------------------#
#plot data if no errors, otherwise print an error message
if(error==FALSE){
	png(filename="${imgout:peaks_png}", width=800, height=400)
		plot(spec, type = "l", xlab = "Time (Minutes)", ylab = "RIU", col="red")
	dev.off()
}else{print("Error generating view, could not understand the delimiter of data format.\nPlease reupload the data.")}


#END
