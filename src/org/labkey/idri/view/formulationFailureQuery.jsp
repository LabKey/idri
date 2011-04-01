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