##
#  Copyright (c) 2011 LabKey Corporation
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
# Concentration Graph.r
# THIS CAN ONLY BE RUN ON THE SERVER -- due to usage of labkey.url.params

library(Rlabkey)

# For development on a local windows dev environment.
# Production in this case is -not- Windows.
labkeyBaseUrl = ""
folderPath <- "/Formulations"

if(.Platform[1] == "windows"){
    labkeyBaseUrl = "http://localhost:8080/labkey"
    folderPath <- "/FormulationsTest"
} else labkeyBaseUrl = "http://idri.labkey.com/"

filter1 <- makeFilter(c("name", "CONTAINS", labkey.url.params$nameContains))

mydata <- labkey.selectRows(baseUrl=labkeyBaseUrl,
                            folderPath=folderPath,
                            schemaName="assay",
                            queryName="HPLCReportSummary",
                            viewName="",
                            colSort=NULL,
                            colFilter=filter1)

mydata
m = data.matrix(mydata)

library(Cairo)
CairoPNG(filename="${imgout:labkey2_png}", width=450, height=225)

mp <- barplot(m[,c(4:ncol(m)-1)], beside=TRUE,
    legend=c("Sample 1", "Sample 2", "Sample 3"),
    ylim=c(0,1200),
    ylab="Concentration (ug/ml)",
    main="HPLC",
    xpd=FALSE,

    col = c("royalblue4", "red4", "yellow1")
)

dev.off()