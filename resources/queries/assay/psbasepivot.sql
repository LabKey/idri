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