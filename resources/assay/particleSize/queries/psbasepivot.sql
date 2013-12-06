/*
 * Copyright (c) 2011-2013 LabKey Corporation
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
psbase.RowId,
psbase.TimeLabel,
psbase.StorageTemperature,
psbase.AnalysisTool,
psbase.ZAveMean,
CASE WHEN psbase.TimeLabel = 'T=0' THEN psbase."Average ZAve" ELSE NULL END AS "T=0",
CASE WHEN psbase.TimeLabel = '1 wk' THEN psbase."Average ZAve" ELSE NULL END AS "1 wk",
CASE WHEN psbase.TimeLabel = '2 wk' THEN psbase."Average ZAve" ELSE NULL END AS "2 wk",
CASE WHEN psbase.TimeLabel = '1 mo' THEN psbase."Average ZAve" ELSE NULL END AS "1 mo",
CASE WHEN psbase.TimeLabel = '3 mo' THEN psbase."Average ZAve" ELSE NULL END AS "3 mo",
CASE WHEN psbase.TimeLabel = '6 mo' THEN psbase."Average ZAve" ELSE NULL END AS "6 mo",
CASE WHEN psbase.TimeLabel = '12 mo' THEN psbase."Average ZAve" ELSE NULL END AS "12 mo",
FROM psbase