import type { DataSource } from "@/types/common";

export const APP_CONFIG = {
  name: "ProjectPilot",
  tagline: "Learning Management System & Coursework Workspace",
  version: "0.1.0",
  dataSource: "mock" as DataSource,
  mockLatencyMs: 120, // Believable network latency simulation
  storageKeys: {
    mockSessionRole: "projectpilot_dev_mock_role",
    mockDatabaseState: "projectpilot_dev_mock_db_v1",
  },
} as const;
