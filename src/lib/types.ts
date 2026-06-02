export interface Demo {
  id: number;
  name: string;
  description: string;
  short_description: string;
  thumbnail_stage_path: string | null;
  thumbnail_url?: string;
  entry_url: string;
  demo_type: "SPCS" | "STREAMLIT";
  topics: string[];
  capabilities: string[];
  click_script_stage_path: string | null;
  video_url: string | null;
  status: "PUBLISHED" | "DRAFT" | "DISABLED";
  sort_order: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export const DEFAULT_TOPICS = [
  "Predictive Maintenance",
  "Quality Control",
  "Supply Chain Optimization",
  "Production Planning",
  "Asset Management",
  "Energy & Sustainability",
  "Digital Twin",
  "Warehouse & Logistics",
];

export const DEFAULT_CAPABILITIES = [
  "Cortex AI",
  "Cortex Agents",
  "Snowpark",
  "Streamlit",
  "SPCS",
  "Dynamic Tables",
  "Notebooks",
  "Iceberg",
  "Data Sharing",
  "Snowpipe Streaming",
  "ML/Model Registry",
  "Document AI",
  "Geospatial",
  "Time Series",
];
