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