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

CREATE TABLE idri."concentrations"
(
    "rowId" serial NOT NULL,
    "concentration" double precision NOT NULL,
    "unit" VARCHAR(10) NOT NULL,
    "compound" integer NOT NULL,
    "material" integer NOT NULL,
    "lot" integer NOT NULL,
    "istop" boolean,

    CONSTRAINT pk_constraints PRIMARY KEY ("rowId"),
    CONSTRAINT fk_compounds FOREIGN KEY ("compound")
        REFERENCES exp.material (rowid) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_materials FOREIGN KEY ("material")
        REFERENCES exp.material (rowid) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_lot FOREIGN KEY ("lot")
        REFERENCES exp.material (rowid) MATCH SIMPLE
        ON UPDATE NO ACTION ON DELETE NO ACTION
);

/* idri-11.30-12.10.sql */

ALTER TABLE idri."concentrations" ADD Container entityid;
UPDATE idri."concentrations" c SET Container = (SELECT container FROM exp.material WHERE rowid=c.lot);
ALTER TABLE idri."concentrations" ALTER COLUMN Container SET NOT NULL;

/* idri-14.30-14.31.sql */

-- Switch rowid column to case-insensitive name. All other column and table names were created lowercase, which makes them case-insensitive.
ALTER TABLE idri.Concentrations
	  RENAME COLUMN "rowId" TO RowId;

-- Rename associated sequence for consistency.
ALTER SEQUENCE idri."concentrations_rowId_seq" RENAME TO concentrations_rowid_seq;