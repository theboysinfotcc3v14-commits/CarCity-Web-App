-- ============================================================
-- CarCity Web - MariaDB 10.11+ Schema
-- Engine: InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) NOT NULL PRIMARY KEY,
  role ENUM('DRIVER', 'WORKSHOP_OWNER', 'ADMIN', 'SUPER_ADMIN') NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  cpf_cnpj VARCHAR(20) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  totp_secret VARCHAR(255) NULL,
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  theme_preference ENUM('DARK', 'LIGHT') NOT NULL DEFAULT 'DARK',
  plan ENUM('BASIC', 'STANDARD', 'ADVANCED') NOT NULL DEFAULT 'BASIC',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  token_version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessions (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  refresh_token_hash VARCHAR(255) NOT NULL,
  ip VARCHAR(45) NOT NULL,
  user_agent TEXT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sessions_user (user_id),
  INDEX idx_sessions_token (refresh_token_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS workshops (
  id CHAR(36) NOT NULL PRIMARY KEY,
  owner_user_id CHAR(36) NOT NULL,
  razao_social VARCHAR(150) NOT NULL,
  nome_fantasia VARCHAR(150) NOT NULL,
  address VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  specialties JSON NOT NULL,
  status ENUM('PENDING_APPROVAL', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'PENDING_APPROVAL',
  review_feedback TEXT NULL,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_user_id) REFERENCES users(id),
  INDEX idx_workshops_geo (latitude, longitude),
  INDEX idx_workshops_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS workshop_documents (
  id CHAR(36) NOT NULL PRIMARY KEY,
  workshop_id CHAR(36) NOT NULL,
  kind ENUM('ALVARA', 'RT_CFT_CREA', 'FOTO_FACHADA', 'FOTO_INSTALACOES', 'CERTIFICADO_TECNICO') NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workshop_id) REFERENCES workshops(id) ON DELETE CASCADE,
  INDEX idx_workshop_docs (workshop_id, kind)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS workshop_offers (
  workshop_id CHAR(36) NOT NULL,
  tier ENUM('STANDARD', 'ADVANCED') NOT NULL,
  discount_percent INT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (workshop_id, tier),
  FOREIGN KEY (workshop_id) REFERENCES workshops(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vehicles (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  brand VARCHAR(60) NOT NULL,
  model VARCHAR(100) NOT NULL,
  model_year INT NOT NULL,
  plate VARCHAR(10) NOT NULL UNIQUE,
  propulsion ENUM('COMBUSTAO', 'HIBRIDO', 'ELETRICO') NOT NULL,
  odometer_km INT NOT NULL DEFAULT 0,
  next_revision_km INT NOT NULL,
  parked_latitude DECIMAL(10, 7) NOT NULL,
  parked_longitude DECIMAL(10, 7) NOT NULL,
  engine_cut_connected BOOLEAN NOT NULL DEFAULT TRUE,
  doors_locked BOOLEAN NOT NULL DEFAULT TRUE,
  panic_mode_active BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_vehicles_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vehicle_readings (
  id CHAR(36) NOT NULL PRIMARY KEY,
  vehicle_id CHAR(36) NOT NULL,
  recorded_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  tire_fl_psi DECIMAL(4, 1) NOT NULL,
  tire_fr_psi DECIMAL(4, 1) NOT NULL,
  tire_rl_psi DECIMAL(4, 1) NOT NULL,
  tire_rr_psi DECIMAL(4, 1) NOT NULL,
  battery_pct INT NOT NULL,
  brake_pad_mm DECIMAL(4, 1) NOT NULL,
  engine_cut_connected BOOLEAN NOT NULL DEFAULT TRUE,
  is_simulated BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  INDEX idx_readings_veh_time (vehicle_id, recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS trips (
  id CHAR(36) NOT NULL PRIMARY KEY,
  vehicle_id CHAR(36) NOT NULL,
  started_at TIMESTAMP NOT NULL,
  distance_km DECIMAL(6, 2) NOT NULL,
  duration_min INT NOT NULL,
  efficiency DECIMAL(5, 2) NOT NULL,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  INDEX idx_trips_veh_start (vehicle_id, started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS maintenance_alerts (
  id CHAR(36) NOT NULL PRIMARY KEY,
  vehicle_id CHAR(36) NOT NULL,
  component ENUM('PNEU', 'OLEO', 'FREIO', 'BATERIA') NOT NULL,
  severity ENUM('PREVENTIVO', 'CRITICO') NOT NULL,
  message VARCHAR(255) NOT NULL,
  status ENUM('ACTIVE', 'SNOOZED', 'RESOLVED') NOT NULL DEFAULT 'ACTIVE',
  snoozed_until TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  INDEX idx_alerts_veh_status (vehicle_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vehicle_commands (
  id CHAR(36) NOT NULL PRIMARY KEY,
  vehicle_id CHAR(36) NOT NULL,
  requested_by CHAR(36) NOT NULL,
  command ENUM('CORTE_MOTOR', 'TRANCAR_PORTAS', 'MODO_PANICO_5KM', 'ACIONAR_POLICIA_BLOQUEIO_TOTAL') NOT NULL,
  status ENUM('REQUESTED', 'CONFIRMED', 'EXECUTED', 'FAILED') NOT NULL DEFAULT 'REQUESTED',
  gateway_response TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  executed_at TIMESTAMP NULL,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  FOREIGN KEY (requested_by) REFERENCES users(id),
  INDEX idx_commands_veh (vehicle_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS risk_reports (
  id CHAR(36) NOT NULL PRIMARY KEY,
  reporter_user_id CHAR(36) NOT NULL,
  risk_type ENUM('FURTO', 'ROUBO', 'OUTRO') NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  description VARCHAR(500) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reporter_user_id) REFERENCES users(id),
  INDEX idx_risk_geo (latitude, longitude),
  INDEX idx_risk_time (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS appointments (
  id CHAR(36) NOT NULL PRIMARY KEY,
  driver_user_id CHAR(36) NOT NULL,
  workshop_id CHAR(36) NOT NULL,
  vehicle_id CHAR(36) NOT NULL,
  service_summary TEXT NOT NULL,
  status ENUM('PENDING', 'IN_REVIEW', 'APPROVED', 'IN_MAINTENANCE', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
  discount_percent INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_user_id) REFERENCES users(id),
  FOREIGN KEY (workshop_id) REFERENCES workshops(id),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS appointment_messages (
  id CHAR(36) NOT NULL PRIMARY KEY,
  appointment_id CHAR(36) NOT NULL,
  sender_user_id CHAR(36) NOT NULL,
  body TEXT NOT NULL,
  quote_amount DECIMAL(10, 2) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS articles (
  id CHAR(36) NOT NULL PRIMARY KEY,
  author_user_id CHAR(36) NOT NULL,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(220) NOT NULL UNIQUE,
  content TEXT NOT NULL,
  category ENUM('ECONOMIA_LEIS', 'SEGURANCA', 'MANUTENCAO') NOT NULL,
  status ENUM('PUBLISHED', 'DRAFT') NOT NULL DEFAULT 'PUBLISHED',
  views_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (author_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS community_posts (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  type ENUM('FORUM', 'DIY') NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  tags JSON NOT NULL,
  youtube_url VARCHAR(255) NULL,
  likes_count INT NOT NULL DEFAULT 0,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS post_comments (
  id CHAR(36) NOT NULL PRIMARY KEY,
  post_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS post_likes (
  post_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  PRIMARY KEY (post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS content_reports (
  id CHAR(36) NOT NULL PRIMARY KEY,
  target_type ENUM('POST', 'COMMENT') NOT NULL,
  target_id CHAR(36) NOT NULL,
  reporter_user_id CHAR(36) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  status ENUM('OPEN', 'KEPT', 'HIDDEN', 'DELETED') NOT NULL DEFAULT 'OPEN',
  resolved_by CHAR(36) NULL,
  resolved_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reporter_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- audit_logs and search_logs without FKs to preserve historic traceability
CREATE TABLE IF NOT EXISTS audit_logs (
  id CHAR(36) NOT NULL PRIMARY KEY,
  actor_user_id CHAR(36) NOT NULL,
  impersonated BOOLEAN NOT NULL DEFAULT FALSE,
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(50) NOT NULL,
  entity_id CHAR(36) NOT NULL,
  metadata JSON NULL,
  ip VARCHAR(45) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_time (created_at),
  INDEX idx_audit_actor (actor_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS search_logs (
  id CHAR(36) NOT NULL PRIMARY KEY,
  term VARCHAR(100) NOT NULL,
  user_id CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_search_time (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
