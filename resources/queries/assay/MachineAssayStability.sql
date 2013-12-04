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