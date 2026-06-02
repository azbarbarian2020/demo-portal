-- Demo Portal - Tables and Settings
-- Creates DEMOS table, SETTINGS table, and seeds default settings

USE WAREHOUSE __WAREHOUSE__;

CREATE TABLE IF NOT EXISTS __DATABASE__.__SCHEMA__.DEMOS (
  id INTEGER AUTOINCREMENT,
  name VARCHAR(500) NOT NULL,
  description VARCHAR(5000),
  short_description VARCHAR(1000),
  thumbnail_stage_path VARCHAR(1000),
  entry_url VARCHAR(2000) NOT NULL,
  demo_type VARCHAR(50) DEFAULT 'SPCS',
  topics ARRAY,
  capabilities ARRAY,
  click_script_stage_path VARCHAR(1000),
  video_url VARCHAR(2000),
  status VARCHAR(50) DEFAULT 'PUBLISHED',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
  updated_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
  created_by VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS __DATABASE__.__SCHEMA__.SETTINGS (
  key VARCHAR(100) PRIMARY KEY,
  value VARIANT
);

MERGE INTO __DATABASE__.__SCHEMA__.SETTINGS t
USING (SELECT 'topics' AS KEY, PARSE_JSON('["Predictive Maintenance","Quality Control","Supply Chain Optimization","Production Planning","Asset Management","Energy & Sustainability","Digital Twin","Warehouse & Logistics"]') AS VALUE) s
ON t.KEY = s.KEY
WHEN NOT MATCHED THEN INSERT (KEY, VALUE) VALUES (s.KEY, s.VALUE);

MERGE INTO __DATABASE__.__SCHEMA__.SETTINGS t
USING (SELECT 'capabilities' AS KEY, PARSE_JSON('["Cortex AI","Cortex Agents","Snowpark","Streamlit","SPCS","Dynamic Tables","Notebooks","Iceberg","Data Sharing","Snowpipe Streaming","ML/Model Registry","Document AI","Geospatial","Time Series"]') AS VALUE) s
ON t.KEY = s.KEY
WHEN NOT MATCHED THEN INSERT (KEY, VALUE) VALUES (s.KEY, s.VALUE);
