##
#  Copyright (c) 2011-2012 LabKey Corporation
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
# This generates spectra graphs
# Peaks Graph.r
# Author(s): Nick Arnold, Quinton Dowling

library(Rlabkey)   # required for labkey.url.params
library(hyperSpec)

nameParam <- labkey.url.params$nameContains

# This is because the IDRI system is on a Linux box.
if(.Platform[1] == "windows"){
    IRDirectory = "C:/work/IDRI/labkey/build/deploy/files/FormulationsTest/@files/IRSpectraData/"
} else IRDirectory = "/labkey/labkey/files/Formulations/@files/IRSpectraData/"

IRfileExt <- ".txt"

IRFileBase <- unlist(strsplit(nameParam, " "))[[1]]
IRFileDerived <- unlist(strsplit(nameParam, " "))[[2]]

IRBase <- paste(IRDirectory, IRFileBase, IRfileExt, sep="")
IRDerived <- paste(IRDirectory, IRFileDerived, IRfileExt, sep="")

spec <- scan.txt.Renishaw(file=IRBase, data="spc")
spec2 <- scan.txt.Renishaw(file=IRDerived, data="spc")

library(Cairo)
CairoPNG(filename="${imgout:peaks_png}", width=600, height=300)

# Data plotted here
plot <- plotspc(spec, col = "red", wl.reverse=TRUE, plot.args = list(main=nameParam))
plot <- plotspc(spec2, col = "navy", wl.reverse=TRUE, add=TRUE)

dev.off()