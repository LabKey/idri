/*
 * Copyright (c) 2013 LabKey Corporation
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
PARAMETERS (AssayRowId INTEGER, MachineType VARCHAR)
SELECT CASE WHEN pbp.StorageTemperature = '5C' THEN '05C' ELSE pbp.StorageTemperature END AS Temperature,
MIN(pbp."T=0") AS "DM",
MIN(pbp."1 wk") AS "1 wk",
MIN(pbp."2 wk") AS "2 wk",
MIN(pbp."1 mo") AS "1 mo",
MIN(pbp."3 mo") AS "3 mo",
MIN(pbp."6 mo") AS "6 mo",
MIN(pbp."12 mo") AS "12 mo",
MIN(pbp.ZAveMean) AS "Mean"
FROM particleSize."Particle Size".psbasepivot AS pbp
WHERE pbp.RowId = AssayRowId AND pbp.AnalysisTool = MachineType
GROUP BY pbp.StorageTemperature