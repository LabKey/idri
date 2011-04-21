<%
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
%>
<%@ page extends="org.labkey.api.jsp.JspBase" %>
SELECT
    "Particle Size Data".properties.TimeLabel AS TimeLabel,
    "Particle Size Data".properties.StorageTemperature AS StorageTemperature,
    ROUND(AVG("Particle Size Data".properties.ZAve), 2) AS "Average ZAve",
    CASE WHEN "Particle Size Data".Run.RunProperties.ZAveMean*1.5 > ROUND(AVG("Particle Size Data".properties.ZAve), 2) THEN 'Success' ELSE 'Fail' END AS "Status",
    "Particle Size Data".Run.RunProperties.ZAveMean
FROM
    "Particle Size Data"
WHERE
    "Particle Size Data".Run.RowId=18754 AND
    ("Particle Size Data".properties.ExtractionNumber=1 OR "Particle Size Data".properties.ExtractionNumber=2 OR "Particle Size Data".properties.ExtractionNumber=3) AND
    "Particle Size Data".properties.AnalysisTool='aps'
GROUP BY
    "Particle Size Data".properties.TimeLabel,
    "Particle Size Data".properties.StorageTemperature,
    "Particle Size Data".Run.RunProperties.ZAveMean