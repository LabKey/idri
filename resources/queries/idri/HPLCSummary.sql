/*
 * Copyright (c) 2014 LabKey Corporation
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