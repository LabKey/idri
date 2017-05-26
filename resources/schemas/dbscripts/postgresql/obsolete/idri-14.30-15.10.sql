/*
 * Copyright (c) 2015-2016 LabKey Corporation
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

/* idri-14.30-14.31.sql */

-- Switch rowid column to case-insensitive name. All other column and table names were created lowercase, which makes them case-insensitive.
ALTER TABLE idri.Concentrations
	  RENAME COLUMN "rowId" TO RowId;

-- Rename associated sequence for consistency.
ALTER SEQUENCE idri."concentrations_rowId_seq" RENAME TO concentrations_rowid_seq;