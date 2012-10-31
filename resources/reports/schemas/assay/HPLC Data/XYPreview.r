#XY Data Plotter
#Quinton Dowling | IDRI
#10 October 2012

#Description: This script will detect delimeter based on filename, and if
#that fails it will try to detect the delimeter automatically from the
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
		plot(spec, type = "l", xlab = "Time (Minutes)", ylab = "Int.", col="red")
	dev.off()
}else{print("Error generating view, could not understand the delimeter of data format.\nPlease reupload the data.")}


#END