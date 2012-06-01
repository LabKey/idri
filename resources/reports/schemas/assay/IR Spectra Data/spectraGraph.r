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
library(hyperSpec)

workdir <- getwd()
#IRDirectory = "C:/code/labkey/release102/build/deploy/files/FormulationsTest/@files/assaydata/"
IRDirectory = "/labkey/labkey/files/Formulations/@files/assaydata/"

setwd(IRDirectory)
nameParam <- labkey.url.params$nameContains

IRfileExt <- ".txt"
IRFileBase <- nameParam

IRBase <- paste(IRDirectory, IRFileBase, IRfileExt, sep="")
spec <- scan.txt.Renishaw(file=IRBase, data="spc")

library(Cairo)

# Write the image to the server
CairoPNG(filename=paste(nameParam, "_IR.png", sep=""), width=600, height=300)

# Data plotted here
plot <- plotspc(spec, wl.reverse=TRUE, plot.args = list(main=nameParam))

dev.off()

# Go back to where the process was started
setwd(workdir)

# Write the image to the pipeline
CairoPNG(filename="${imgout:labkeyl_png}", width=600, height=300)

# Data plotted here
plot <- plotspc(spec, wl.reverse=TRUE, plot.args = list(main=nameParam))

dev.off()