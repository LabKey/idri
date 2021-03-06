/*
 * Copyright (c) 2013-2016 LabKey Corporation
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

PARAMETERS (RunName VARCHAR, StoreTemp VARCHAR, Tool VARCHAR)
SELECT D.Run.Name
,D.Run.RowId
,D.Run.Protocol AS Protocol
,D.Run.Input AS Formulation    /* Was D.Run.Input.Material.RowId */
,D.Properties.StorageTemperature
,D.Properties.AnalysisTool
,MIN('Z-Avg') AS "Measure"
,D.Properties.TestNumber AS Test,
ROUND(CONVERT(AVG(CASE WHEN D.Properties.TimeLabel = 'T=0' THEN
          D.Properties.ZAve ELSE NULL END) , SQL_DOUBLE),0)  AS DM,
ROUND(CONVERT(AVG(CASE WHEN D.Properties.TimeLabel = '1 wk' THEN
          D.Properties.ZAve ELSE NULL END) , SQL_DOUBLE),0)  AS wk1,
ROUND(CONVERT(AVG(CASE WHEN D.Properties.TimeLabel = '2 wk' THEN
          D.Properties.ZAve ELSE NULL END) , SQL_DOUBLE),0)  AS wk2,
ROUND(CONVERT(AVG(CASE WHEN D.Properties.TimeLabel = '1 mo' THEN
          D.Properties.ZAve ELSE NULL END) , SQL_DOUBLE),0)  AS mo1,
ROUND(CONVERT(AVG(CASE WHEN D.Properties.TimeLabel = '3 mo' THEN
          D.Properties.ZAve ELSE NULL END) , SQL_DOUBLE),0)  AS mo3,
ROUND(CONVERT(AVG(CASE WHEN D.Properties.TimeLabel = '6 mo' THEN
          D.Properties.ZAve ELSE NULL END) , SQL_DOUBLE),0)  AS mo6,
ROUND(CONVERT(AVG(CASE WHEN D.Properties.TimeLabel = '9 mo'THEN
          D.Properties.ZAve ELSE NULL END) , SQL_DOUBLE),0)  AS mo9,
ROUND(CONVERT(AVG(CASE WHEN D.Properties.TimeLabel = '12 mo' THEN
          D.Properties.ZAve ELSE NULL END) , SQL_DOUBLE),0)  AS mo12,
ROUND(CONVERT(AVG(CASE WHEN D.Properties.TimeLabel = '24 mo' OR
                            D.Properties.TimeLabel = '2 yr' THEN
          D.Properties.ZAve ELSE NULL END) , SQL_DOUBLE),0)  AS mo24,
ROUND(CONVERT(AVG(CASE WHEN D.Properties.TimeLabel = '36 mo' OR
                            D.Properties.TimeLabel = '3 yr' THEN
          D.Properties.ZAve ELSE NULL END) , SQL_DOUBLE),0)  AS mo36

FROM Data AS D
WHERE D.Run.Name = RunName
AND D.Properties.StorageTemperature = StoreTemp
AND D.Properties.AnalysisTool = Tool
AND (D.Properties.TestNumber = 1 OR D.Properties.TestNumber = 2 OR D.Properties.TestNumber = 3)
GROUP BY  D.Run.Name
,D.Run.RowId
,D.Run.Protocol
,D.Run.Input
,D.Properties.TestNumber
,D.Properties.StorageTemperature
,D.Properties.AnalysisTool

UNION
SELECT D.Run.Name
,D.Run.RowId
,D.Run.Protocol AS Protocol
,D.Run.Input AS Formulation
,D.Properties.StorageTemperature
,D.Properties.AnalysisTool
,MIN('Pdl') AS Measure, 
D.Properties.TestNumber AS Test,
ROUND(CONVERT(AVG(CASE WHEN LCASE(D.Properties.TimeLabel) = 'dm' OR
                            D.Properties.TimeLabel = 'T=0' THEN
          D.Properties.Pdl ELSE NULL END) , SQL_DOUBLE),2)  AS DM,
ROUND(CONVERT(AVG(CASE WHEN D.Properties.TimeLabel = '1 wk' THEN
          D.Properties.Pdl ELSE NULL END) , SQL_DOUBLE),2)  AS wk1,
ROUND(CONVERT(AVG(CASE WHEN D.Properties.TimeLabel = '2 wk' THEN
          D.Properties.Pdl ELSE NULL END) , SQL_DOUBLE),2)  AS wk2,
ROUND(CONVERT(AVG(CASE WHEN D.Properties.TimeLabel = '1 mo' THEN
          D.Properties.Pdl ELSE NULL END) , SQL_DOUBLE),2)  AS mo1,
ROUND(CONVERT(AVG(CASE WHEN D.Properties.TimeLabel = '3 mo' THEN
          D.Properties.Pdl ELSE NULL END) , SQL_DOUBLE),2)  AS mo3,
ROUND(CONVERT(AVG(CASE WHEN D.Properties.TimeLabel = '6 mo' THEN
          D.Properties.Pdl ELSE NULL END) , SQL_DOUBLE),2)  AS mo6,
ROUND(CONVERT(AVG(CASE WHEN D.Properties.TimeLabel = '9 mo' THEN
          D.Properties.Pdl ELSE NULL END) , SQL_DOUBLE),2)  AS mo9,
ROUND(CONVERT(AVG(CASE WHEN D.Properties.TimeLabel = '12 mo' THEN
          D.Properties.Pdl ELSE NULL END) , SQL_DOUBLE),2)  AS mo12,
ROUND(CONVERT(AVG(CASE WHEN D.Properties.TimeLabel = '24 mo' OR
                            D.Properties.TimeLabel = '2 yr' THEN
          D.Properties.Pdl ELSE NULL END) , SQL_DOUBLE),2)  AS mo24,
ROUND(CONVERT(AVG(CASE WHEN D.Properties.TimeLabel = '36 mo' OR
                            D.Properties.TimeLabel = '3 yr' THEN
          D.Properties.Pdl ELSE NULL END) , SQL_DOUBLE),2)  AS mo36

FROM Data AS D
WHERE D.Run.Name = RunName
AND D.Properties.StorageTemperature = StoreTemp
AND D.Properties.AnalysisTool = Tool
AND (D.Properties.TestNumber = 1 OR D.Properties.TestNumber = 2 OR D.Properties.TestNumber = 3)
GROUP BY  D.Run.Name
,D.Run.RowId
,D.Run.Protocol
,D.Run.Input
,D.Properties.TestNumber
,D.Properties.StorageTemperature
,D.Properties.AnalysisTool