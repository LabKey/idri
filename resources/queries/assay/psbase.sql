/*
 * Copyright (c) 2011 LabKey Corporation
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
"Particle Size Data".Run.RowId,
"Particle Size Data".properties.AnalysisTool AS AnalysisTool,
"Particle Size Data".properties.TimeLabel AS TimeLabel,
"Particle Size Data".properties.StorageTemperature AS StorageTemperature,
ROUND(AVG("Particle Size Data".properties.ZAve), 2) AS "Average ZAve",
"Particle Size Data".Run.RunProperties.ZAveMean
FROM
"Particle Size Data"
WHERE
"Particle Size Data".properties.ExtractionNumber=1 OR "Particle Size Data".properties.ExtractionNumber=2 OR "Particle Size Data".properties.ExtractionNumber=3
GROUP BY
"Particle Size Data".properties.TimeLabel,
"Particle Size Data".properties.StorageTemperature,
"Particle Size Data".Run.RunProperties.ZAveMean,
"Particle Size Data".Run.RowId,
"Particle Size Data".properties.AnalysisTool

/* CASE WHEN "Particle Size Data".Run.RunProperties.ZAveMean*1.5 > ROUND(AVG("Particle Size Data".properties.ZAve), 2) THEN ROUND(AVG("Particle Size Data".properties.ZAve), 2) ELSE ROUND(AVG("Particle Size Data".properties.ZAve), 2) END AS "Status",*/