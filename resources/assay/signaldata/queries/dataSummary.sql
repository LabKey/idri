PARAMETERS (Formulation VARCHAR DEFAULT '')

SELECT DISTINCT
Data.Run.RowId,
Data.Run.Name AS RunName,
Data.Run.Created
FROM Data
WHERE Name LIKE concat(Formulation, '%')