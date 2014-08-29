/*
 * Copyright (c) 2011-2014 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
SELECT
PSD.Run.RowId,
AnalysisTool,
TimeLabel,
StorageTemperature,
ROUND(AVG(ZAve), 2) AS "Average ZAve",
PSD.Run.RunProperties.ZAveMean
FROM
assay.particleSize."Particle Size".Data AS PSD
WHERE
ExtractionNumber IN (1,2,3)
GROUP BY
TimeLabel,
StorageTemperature,
PSD.Run.RunProperties.ZAveMean,
PSD.Run.RowId,
AnalysisTool
PIVOT "Average ZAve" BY TimeLabel IN (SELECT Time FROM lists.Timepoints ORDER BY sort)