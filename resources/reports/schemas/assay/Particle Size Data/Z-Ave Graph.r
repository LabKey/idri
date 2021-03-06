##
#  Copyright (c) 2012-2018 LabKey Corporation
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
# Z-Avg Graph.r

library(Rlabkey)

# Relative Directory to where Particle Size Images are stored
relativeDirectory <- paste("/labkey/labkey/files", labkey.url.path, "@files/PSData", sep="")
setwd(relativeDirectory)

searchParam      <- labkey.url.params$nameContains
temperatureParam <- labkey.url.params$storageTemp
toolParam        <- labkey.url.params$analysisTool
exactName        <- labkey.url.params$exactName

cat("searchParam:", searchParam, "\n")
cat("temperatureParam:", temperatureParam, "\n")
cat("toolParam:", toolParam, "\n")
cat("exactName:", exactName, "\n")
cat("base URL:", labkey.url.base, "\n")
cat("folder:", labkey.url.path, "\n")

filter1 <- makeFilter(c("name", "EQUALS", searchParam))
filter2 <- makeFilter(c("StorageTemperature", "EQUALS", temperatureParam))
filter3 <- makeFilter(c("AnalysisTool", "EQUALS", toolParam))

cat("Filter 1:", filter1, "\n")
cat("Filter 2:", filter2, "\n")
cat("Filter 3:", filter3, "\n")

mydata <- suppressWarnings(labkey.selectRows(baseUrl=labkey.url.base,
                            folderPath=labkey.url.path,
                            schemaName="assay.particleSize.Particle Size",
                            queryName="R_ReportSummaryNonParameter",
                            colFilter=c(filter1,filter2,filter3)))

# This is NOT GOOD - view-dependence.
# There should only be a certain set of columns in the default view
# Run Assay Id, Measure (sorted descending), Test (sorted ascending), DM, ..., 36 mo in that order

# Truncate the initial columns
m <- data.matrix(mydata[4:(ncol(mydata))])

# Generate bar plot with labels and time stamp
if (toolParam == "nano") {
	png(filename=paste(exactName,"_nanoPS.png",sep=""),width=650)
} else {
	png(filename=paste(exactName,"_apsPS.png",sep=""),width=650)
}

	#Graphical parameters
	legend <- c("Test 1", "Test 2" , "Test 3")
	columnSep <- 0.1
	marg <- par()$mar
	omarg <- marg * 0.33

	# Data plotted here
	par(oma = omarg)
    	mp <- barplot(m, beside=TRUE,
		legend=legend,
		args.legend=list(horiz=TRUE),
		ylim=c(0,200),
		ylab="Z-Avg (nm)",
		main=paste("PS ", toupper(exactName), toolParam),
		xpd=FALSE,
		axis.lty = 1,
		col = c("royalblue4", "red4", "yellow1"))

	#Include a timestamp on the figure
	shortname <- "Particle Size"
	mtext(format(Sys.time(), "%Y-%m-%d %H:%M"),
		cex=0.75,
		line=0,
		side=1,
		adj=0,
		outer=TRUE
	)
	box("outer", lty="solid", col="black")

	mtext(side = 1, at = colMeans(mp), line = 2, text = "Mean:", cex=0.8)
	mtext(side = 1, line = 4, text = "TimePoint", cex=1.0)
	mtext(side = 1, at = colMeans(mp), line = 3, text = formatC(colMeans(m), format="fg", digits=5), cex=0.8)

dev.off()

if (toolParam == "nano") {
	png(filename="${imgout:labkeynano_png}", width=650)
} else {
	png(filename="${imgout:labkeyaps_png}", width=650)
}

	#Graphical parameters
	legend <- c("Test 1", "Test 2" , "Test 3")
	columnSep <- 0.1
	marg <- par()$mar
	omarg <- marg * 0.33

	# Data plotted here
	par(oma = omarg)
    	mp <- barplot(m, beside=TRUE,
		legend=legend,
		args.legend=list(horiz=TRUE),
		ylim=c(0,200),
		ylab="Z-Avg (nm)",
		main=paste("PS ", toupper(exactName), toolParam),
		xpd=FALSE,
		axis.lty = 1,
		col = c("royalblue4", "red4", "yellow1"))

	#Include a timestamp on the figure
	shortname <- "Particle Size"
	mtext(format(Sys.time(), "%Y-%m-%d %H:%M"),
		cex=0.75,
		line=0,
		side=1,
		adj=0,
		outer=TRUE
	)
	box("outer", lty="solid", col="black")

	mtext(side = 1, at = colMeans(mp), line = 2, text = "Mean:", cex=0.8)
	mtext(side = 1, line = 4, text = "TimePoint", cex=1.0)
	mtext(side = 1, at = colMeans(mp), line = 3, text = formatC(colMeans(m), format="fg", digits=5), cex=0.8)

dev.off()