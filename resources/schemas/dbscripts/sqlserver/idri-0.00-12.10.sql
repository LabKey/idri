/*
 * Copyright (c) 2014-2016 LabKey Corporation
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

/* idri-0.00-11.10.sql */

CREATE SCHEMA idri;
GO

CREATE TABLE idri.concentrations
(
	RowId INT IDENTITY(1, 1) NOT NULL,
	Concentration FLOAT NOT NULL,
	Unit NVARCHAR(255) NOT NULL,
	Compound INT NOT NULL,
	Material INT NOT NULL,
	Lot INT NOT NULL,
	IsTop BIT,

	CONSTRAINT PK_Constraints PRIMARY KEY (RowID),
	CONSTRAINT FK_Compounds FOREIGN KEY (Compound) REFERENCES exp.Material(RowId),
	CONSTRAINT FK_Materials FOREIGN KEY (Material) REFERENCES exp.Material(RowId),
	CONSTRAINT FK_Lot FOREIGN KEY (Lot) REFERENCES exp.Material(RowId)
);

/* idri-11.30-12.10.sql */

ALTER TABLE idri.concentrations ADD Container ENTITYID null
GO

UPDATE idri.concentrations SET Container = (SELECT Container FROM exp.Material r WHERE r.RowId = Lot)
GO

ALTER TABLE idri.concentrations ALTER COLUMN Container ENTITYID NOT NULL
GO