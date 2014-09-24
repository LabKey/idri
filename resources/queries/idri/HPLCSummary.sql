PARAMETERS (Formulation VARCHAR DEFAULT '')
SELECT
Runs.Name AS RunName,
Runs.RunDate,
Runs.Created AS "QC Date",
Runs.Time,
Runs.Compound,
Runs.StandardInstance AS Standard,
Runs.Concentration AS "Avg Conc",
Runs.StandardDeviation AS "Std Dev"
FROM assay.hplc.HPLC.Runs AS Runs
WHERE Runs.Name = Formulation