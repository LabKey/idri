/*
 * Copyright (c) 2011-2013 LabKey Corporation
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