SELECT
RowId,
"Name",
FROM Samples."Raw Materials"

UNION

SELECT
RowId,
"Name",
FROM Samples."Formulations"