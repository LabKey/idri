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

SELECT "Particle Size Data".Run.Name
,"Particle Size Data".Run.RowId
,"Particle Size Data".Run.Protocol AS Protocol
,"Particle Size Data".Run.Input as Formulation    /* Was "Particle Size Data".Run.Input.Material.RowId */
,"Particle Size Data".Properties.StorageTemperature
,"Particle Size Data".Properties.AnalysisTool
,MIN('Z-Avg') AS "Measure"
,"Particle Size Data".Properties.TestNumber AS Test,
ROUND(CONVERT(AVG(CASE WHEN "Particle Size Data".Properties.TimeLabel = 'T=0' THEN
          "Particle Size Data".Properties.ZAve ELSE NULL END) , SQL_DOUBLE),0)  AS DM,
ROUND(CONVERT(AVG(CASE WHEN "Particle Size Data".Properties.TimeLabel = '1 wk' THEN
          "Particle Size Data".Properties.ZAve ELSE NULL END) , SQL_DOUBLE),0)  AS wk1,
ROUND(CONVERT(AVG(CASE WHEN "Particle Size Data".Properties.TimeLabel = '2 wk' THEN
          "Particle Size Data".Properties.ZAve ELSE NULL END) , SQL_DOUBLE),0)  AS wk2,
ROUND(CONVERT(AVG(CASE WHEN "Particle Size Data".Properties.TimeLabel = '1 mo' THEN
          "Particle Size Data".Properties.ZAve ELSE NULL END) , SQL_DOUBLE),0)  AS mo1,
ROUND(CONVERT(AVG(CASE WHEN "Particle Size Data".Properties.TimeLabel = '3 mo' THEN
          "Particle Size Data".Properties.ZAve ELSE NULL END) , SQL_DOUBLE),0)  AS mo3,
ROUND(CONVERT(AVG(CASE WHEN "Particle Size Data".Properties.TimeLabel = '6 mo' THEN
          "Particle Size Data".Properties.ZAve ELSE NULL END) , SQL_DOUBLE),0)  AS mo6,
ROUND(CONVERT(AVG(CASE WHEN "Particle Size Data".Properties.TimeLabel = '9 mo'THEN
          "Particle Size Data".Properties.ZAve ELSE NULL END) , SQL_DOUBLE),0)  AS mo9,
ROUND(CONVERT(AVG(CASE WHEN "Particle Size Data".Properties.TimeLabel = '12 mo' THEN
          "Particle Size Data".Properties.ZAve ELSE NULL END) , SQL_DOUBLE),0)  AS mo12,
ROUND(CONVERT(AVG(CASE WHEN "Particle Size Data".Properties.TimeLabel = '24 mo' OR
                            "Particle Size Data".Properties.TimeLabel = '2 yr' THEN
          "Particle Size Data".Properties.ZAve ELSE NULL END) , SQL_DOUBLE),0)  AS mo24,
ROUND(CONVERT(AVG(CASE WHEN "Particle Size Data".Properties.TimeLabel = '36 mo' OR
                            "Particle Size Data".Properties.TimeLabel = '3 yr' THEN
          "Particle Size Data".Properties.ZAve ELSE NULL END) , SQL_DOUBLE),0)  AS mo36

FROM "Particle Size Data"
WHERE "Particle Size Data".Properties.TestNumber = 1 OR
"Particle Size Data".Properties.TestNumber = 2 OR
"Particle Size Data".Properties.TestNumber = 3
GROUP BY  "Particle Size Data".Run.Name
, "Particle Size Data".Run.RowId
,"Particle Size Data".Run.Protocol
,"Particle Size Data".Run.Input
, "Particle Size Data".Properties.TestNumber
,"Particle Size Data".Properties.StorageTemperature
,"Particle Size Data".Properties.AnalysisTool

UNION
SELECT "Particle Size Data".Run.Name
,"Particle Size Data".Run.RowId
,"Particle Size Data".Run.Protocol  AS Protocol
,"Particle Size Data".Run.Input as Formulation
,"Particle Size Data".Properties.StorageTemperature
,"Particle Size Data".Properties.AnalysisTool
,MIN('Pdl') AS Measure, 
"Particle Size Data".Properties.TestNumber AS Test,
ROUND(CONVERT(AVG(CASE WHEN LCASE("Particle Size Data".Properties.TimeLabel) = 'dm' OR
                            "Particle Size Data".Properties.TimeLabel = 'T=0' THEN
          "Particle Size Data".Properties.Pdl ELSE NULL END) , SQL_DOUBLE),2)  AS DM,
ROUND(CONVERT(AVG(CASE WHEN "Particle Size Data".Properties.TimeLabel = '1 wk' THEN
          "Particle Size Data".Properties.Pdl ELSE NULL END) , SQL_DOUBLE),2)  AS wk1,
ROUND(CONVERT(AVG(CASE WHEN "Particle Size Data".Properties.TimeLabel = '2 wk' THEN
          "Particle Size Data".Properties.Pdl ELSE NULL END) , SQL_DOUBLE),2)  AS wk2,
ROUND(CONVERT(AVG(CASE WHEN "Particle Size Data".Properties.TimeLabel = '1 mo' THEN
          "Particle Size Data".Properties.Pdl ELSE NULL END) , SQL_DOUBLE),2)  AS mo1,
ROUND(CONVERT(AVG(CASE WHEN "Particle Size Data".Properties.TimeLabel = '3 mo' THEN
          "Particle Size Data".Properties.Pdl ELSE NULL END) , SQL_DOUBLE),2)  AS mo3,
ROUND(CONVERT(AVG(CASE WHEN "Particle Size Data".Properties.TimeLabel = '6 mo' THEN
          "Particle Size Data".Properties.Pdl ELSE NULL END) , SQL_DOUBLE),2)  AS mo6,
ROUND(CONVERT(AVG(CASE WHEN "Particle Size Data".Properties.TimeLabel = '9 mo' THEN
          "Particle Size Data".Properties.Pdl ELSE NULL END) , SQL_DOUBLE),2)  AS mo9,
ROUND(CONVERT(AVG(CASE WHEN "Particle Size Data".Properties.TimeLabel = '12 mo' THEN
          "Particle Size Data".Properties.Pdl ELSE NULL END) , SQL_DOUBLE),2)  AS mo12,
ROUND(CONVERT(AVG(CASE WHEN "Particle Size Data".Properties.TimeLabel = '24 mo' OR
                            "Particle Size Data".Properties.TimeLabel = '2 yr' THEN
          "Particle Size Data".Properties.Pdl ELSE NULL END) , SQL_DOUBLE),2)  AS mo24,
ROUND(CONVERT(AVG(CASE WHEN "Particle Size Data".Properties.TimeLabel = '36 mo' OR
                            "Particle Size Data".Properties.TimeLabel = '3 yr' THEN
          "Particle Size Data".Properties.Pdl ELSE NULL END) , SQL_DOUBLE),2)  AS mo36

FROM "Particle Size Data"
WHERE "Particle Size Data".Properties.TestNumber = 1 OR
"Particle Size Data".Properties.TestNumber = 2 OR
"Particle Size Data".Properties.TestNumber = 3
GROUP BY  "Particle Size Data".Run.Name
, "Particle Size Data".Run.RowId
,"Particle Size Data".Run.Protocol
,"Particle Size Data".Run.Input
, "Particle Size Data".Properties.TestNumber
,"Particle Size Data".Properties.StorageTemperature
,"Particle Size Data".Properties.AnalysisTool