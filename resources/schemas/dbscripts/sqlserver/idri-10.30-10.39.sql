CREATE TABLE idri.concentrations
(
	RowId INT IDENTITY(1,1) NOT NULL,
	Concentration FLOAT NOT NULL,
	Unit NVARCHAR(255) NOT NULL,
	Compound INT NOT NULL,
	Material INT NOT NULL,
	Lot INT NOT NULL,
	isTop BIT,

	CONSTRAINT PK_Constraints PRIMARY KEY (RowID),
	CONSTRAINT FK_Compounds FOREIGN KEY (Compound) REFERENCES exp.Material(RowId),
	CONSTRAINT FK_Materials FOREIGN KEY (Material) REFERENCES exp.Material(RowId),
	CONSTRAINT FK_Lot FOREIGN KEY (Lot) REFERENCES exp.Material(RowId)
);