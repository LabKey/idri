-- Create schema, tables, indexes, and constraints used for idri module here
-- All SQL VIEW definitions should be created in idri-create.sql and dropped in idri-drop.sql
CREATE SCHEMA idri;

CREATE TABLE idri."concentrations"
(
  "rowId" serial not null,
  "concentration" double precision NOT NULL,
  "unit" character varying(10) NOT NULL,
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