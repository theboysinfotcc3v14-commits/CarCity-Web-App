import {
  mysqlTable,
  char,
  varchar,
  int,
  decimal,
  timestamp,
  mysqlEnum,
  boolean,
  json,
  text,
  index,
  primaryKey,
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// 1. Users Table
export const users = mysqlTable(
  'users',
  {
    id: char('id', { length: 36 }).notNull().primaryKey(),
    role: mysqlEnum('role', ['DRIVER', 'WORKSHOP_OWNER', 'ADMIN', 'SUPER_ADMIN']).notNull(),
    full_name: varchar('full_name', { length: 150 }).notNull(),
    email: varchar('email', { length: 190 }).notNull().unique(),
    cpf_cnpj: varchar('cpf_cnpj', { length: 20 }).notNull().unique(),
    password_hash: varchar('password_hash', { length: 255 }).notNull(),
    totp_secret: varchar('totp_secret', { length: 255 }),
    must_change_password: boolean('must_change_password').notNull().default(false),
    theme_preference: mysqlEnum('theme_preference', ['DARK', 'LIGHT']).notNull().default('DARK'),
    plan: mysqlEnum('plan', ['BASIC', 'STANDARD', 'ADVANCED']).notNull().default('BASIC'),
    is_active: boolean('is_active').notNull().default(true),
    token_version: int('token_version').notNull().default(1),
    created_at: timestamp('created_at').notNull().defaultNow(),
  }
);

// 2. Sessions Table (Opaque refresh tokens with SHA-256 hash)
export const sessions = mysqlTable(
  'sessions',
  {
    id: char('id', { length: 36 }).notNull().primaryKey(),
    user_id: char('user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    refresh_token_hash: varchar('refresh_token_hash', { length: 255 }).notNull(),
    ip: varchar('ip', { length: 45 }).notNull(),
    user_agent: text('user_agent'),
    expires_at: timestamp('expires_at').notNull(),
    revoked_at: timestamp('revoked_at'),
  },
  (table) => [
    index('idx_sessions_user').on(table.user_id),
    index('idx_sessions_token').on(table.refresh_token_hash),
  ]
);

// 3. Workshops Table
export const workshops = mysqlTable(
  'workshops',
  {
    id: char('id', { length: 36 }).notNull().primaryKey(),
    owner_user_id: char('owner_user_id', { length: 36 })
      .notNull()
      .references(() => users.id),
    razao_social: varchar('razao_social', { length: 150 }).notNull(),
    nome_fantasia: varchar('nome_fantasia', { length: 150 }).notNull(),
    address: varchar('address', { length: 255 }).notNull(),
    latitude: decimal('latitude', { precision: 10, scale: 7 }).notNull(),
    longitude: decimal('longitude', { precision: 10, scale: 7 }).notNull(),
    specialties: json('specialties').$type<string[]>().notNull(),
    status: mysqlEnum('status', ['PENDING_APPROVAL', 'VERIFIED', 'REJECTED'])
      .notNull()
      .default('PENDING_APPROVAL'),
    review_feedback: text('review_feedback'),
    deleted_at: timestamp('deleted_at'),
    created_at: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_workshops_geo').on(table.latitude, table.longitude),
    index('idx_workshops_status').on(table.status),
  ]
);

// 4. Workshop Documents Table (Anti-fraud verification)
export const workshopDocuments = mysqlTable(
  'workshop_documents',
  {
    id: char('id', { length: 36 }).notNull().primaryKey(),
    workshop_id: char('workshop_id', { length: 36 })
      .notNull()
      .references(() => workshops.id, { onDelete: 'cascade' }),
    kind: mysqlEnum('kind', [
      'ALVARA',
      'RT_CFT_CREA',
      'FOTO_FACHADA',
      'FOTO_INSTALACOES',
      'CERTIFICADO_TECNICO',
    ]).notNull(),
    file_url: varchar('file_url', { length: 500 }).notNull(),
    uploaded_at: timestamp('uploaded_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_workshop_docs').on(table.workshop_id, table.kind),
  ]
);

// 5. Workshop Offers Table (Member benefits)
export const workshopOffers = mysqlTable(
  'workshop_offers',
  {
    workshop_id: char('workshop_id', { length: 36 })
      .notNull()
      .references(() => workshops.id, { onDelete: 'cascade' }),
    tier: mysqlEnum('tier', ['STANDARD', 'ADVANCED']).notNull(),
    discount_percent: int('discount_percent').notNull(),
    is_active: boolean('is_active').notNull().default(true),
  },
  (table) => [
    primaryKey({ columns: [table.workshop_id, table.tier] }),
  ]
);

// 6. Vehicles Table
export const vehicles = mysqlTable(
  'vehicles',
  {
    id: char('id', { length: 36 }).notNull().primaryKey(),
    user_id: char('user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    brand: varchar('brand', { length: 60 }).notNull(),
    model: varchar('model', { length: 100 }).notNull(),
    model_year: int('model_year').notNull(),
    plate: varchar('plate', { length: 10 }).notNull().unique(),
    propulsion: mysqlEnum('propulsion', ['COMBUSTAO', 'HIBRIDO', 'ELETRICO']).notNull(),
    odometer_km: int('odometer_km').notNull().default(0),
    next_revision_km: int('next_revision_km').notNull(),
    parked_latitude: decimal('parked_latitude', { precision: 10, scale: 7 }).notNull(),
    parked_longitude: decimal('parked_longitude', { precision: 10, scale: 7 }).notNull(),
    engine_cut_connected: boolean('engine_cut_connected').notNull().default(true),
    doors_locked: boolean('doors_locked').notNull().default(true),
    panic_mode_active: boolean('panic_mode_active').notNull().default(false),
  },
  (table) => [
    index('idx_vehicles_user').on(table.user_id),
  ]
);

// 7. Vehicle Readings Table (CAN/OBD-II IoT telemetry)
export const vehicleReadings = mysqlTable(
  'vehicle_readings',
  {
    id: char('id', { length: 36 }).notNull().primaryKey(),
    vehicle_id: char('vehicle_id', { length: 36 })
      .notNull()
      .references(() => vehicles.id, { onDelete: 'cascade' }),
    recorded_at: timestamp('recorded_at', { fsp: 3 }).notNull().defaultNow(),
    tire_fl_psi: decimal('tire_fl_psi', { precision: 4, scale: 1 }).notNull(),
    tire_fr_psi: decimal('tire_fr_psi', { precision: 4, scale: 1 }).notNull(),
    tire_rl_psi: decimal('tire_rl_psi', { precision: 4, scale: 1 }).notNull(),
    tire_rr_psi: decimal('tire_rr_psi', { precision: 4, scale: 1 }).notNull(),
    battery_pct: int('battery_pct').notNull(),
    brake_pad_mm: decimal('brake_pad_mm', { precision: 4, scale: 1 }).notNull(),
    engine_cut_connected: boolean('engine_cut_connected').notNull().default(true),
    is_simulated: boolean('is_simulated').notNull().default(false),
  },
  (table) => [
    index('idx_readings_veh_time').on(table.vehicle_id, table.recorded_at),
  ]
);

// 8. Trips Table (Horizons 24H, 7D, 4S, 6M)
export const trips = mysqlTable(
  'trips',
  {
    id: char('id', { length: 36 }).notNull().primaryKey(),
    vehicle_id: char('vehicle_id', { length: 36 })
      .notNull()
      .references(() => vehicles.id, { onDelete: 'cascade' }),
    started_at: timestamp('started_at').notNull(),
    distance_km: decimal('distance_km', { precision: 6, scale: 2 }).notNull(),
    duration_min: int('duration_min').notNull(),
    efficiency: decimal('efficiency', { precision: 5, scale: 2 }).notNull(),
  },
  (table) => [
    index('idx_trips_veh_start').on(table.vehicle_id, table.started_at),
  ]
);

// 9. Maintenance Alerts Table
export const maintenanceAlerts = mysqlTable(
  'maintenance_alerts',
  {
    id: char('id', { length: 36 }).notNull().primaryKey(),
    vehicle_id: char('vehicle_id', { length: 36 })
      .notNull()
      .references(() => vehicles.id, { onDelete: 'cascade' }),
    component: mysqlEnum('component', ['PNEU', 'OLEO', 'FREIO', 'BATERIA']).notNull(),
    severity: mysqlEnum('severity', ['PREVENTIVO', 'CRITICO']).notNull(),
    message: varchar('message', { length: 255 }).notNull(),
    status: mysqlEnum('status', ['ACTIVE', 'SNOOZED', 'RESOLVED']).notNull().default('ACTIVE'),
    snoozed_until: timestamp('snoozed_until'),
    created_at: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_alerts_veh_status').on(table.vehicle_id, table.status),
  ]
);

// 10. Vehicle Commands Table (Two-step confirmation & audit)
export const vehicleCommands = mysqlTable(
  'vehicle_commands',
  {
    id: char('id', { length: 36 }).notNull().primaryKey(),
    vehicle_id: char('vehicle_id', { length: 36 })
      .notNull()
      .references(() => vehicles.id, { onDelete: 'cascade' }),
    requested_by: char('requested_by', { length: 36 })
      .notNull()
      .references(() => users.id),
    command: mysqlEnum('command', [
      'CORTE_MOTOR',
      'TRANCAR_PORTAS',
      'MODO_PANICO_5KM',
      'ACIONAR_POLICIA_BLOQUEIO_TOTAL',
    ]).notNull(),
    status: mysqlEnum('status', ['REQUESTED', 'CONFIRMED', 'EXECUTED', 'FAILED'])
      .notNull()
      .default('REQUESTED'),
    gateway_response: text('gateway_response').notNull(),
    created_at: timestamp('created_at').notNull().defaultNow(),
    executed_at: timestamp('executed_at'),
  },
  (table) => [
    index('idx_commands_veh').on(table.vehicle_id),
  ]
);

// 11. Risk Reports Table (Collaborative GPS & Amber heatmap)
export const riskReports = mysqlTable(
  'risk_reports',
  {
    id: char('id', { length: 36 }).notNull().primaryKey(),
    reporter_user_id: char('reporter_user_id', { length: 36 })
      .notNull()
      .references(() => users.id),
    risk_type: mysqlEnum('risk_type', ['FURTO', 'ROUBO', 'OUTRO']).notNull(),
    latitude: decimal('latitude', { precision: 10, scale: 7 }).notNull(),
    longitude: decimal('longitude', { precision: 10, scale: 7 }).notNull(),
    description: varchar('description', { length: 500 }).notNull(),
    created_at: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_risk_geo').on(table.latitude, table.longitude),
    index('idx_risk_time').on(table.created_at),
  ]
);

// 12. Appointments Table (B2B Booking & Pipeline)
export const appointments = mysqlTable(
  'appointments',
  {
    id: char('id', { length: 36 }).notNull().primaryKey(),
    driver_user_id: char('driver_user_id', { length: 36 })
      .notNull()
      .references(() => users.id),
    workshop_id: char('workshop_id', { length: 36 })
      .notNull()
      .references(() => workshops.id),
    vehicle_id: char('vehicle_id', { length: 36 })
      .notNull()
      .references(() => vehicles.id),
    service_summary: text('service_summary').notNull(),
    status: mysqlEnum('status', ['PENDING', 'IN_REVIEW', 'APPROVED', 'IN_MAINTENANCE', 'COMPLETED'])
      .notNull()
      .default('PENDING'),
    discount_percent: int('discount_percent').notNull().default(0),
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at').notNull().defaultNow(),
  }
);

// 13. Appointment Messages Table (Chat with quotes)
export const appointmentMessages = mysqlTable(
  'appointment_messages',
  {
    id: char('id', { length: 36 }).notNull().primaryKey(),
    appointment_id: char('appointment_id', { length: 36 })
      .notNull()
      .references(() => appointments.id, { onDelete: 'cascade' }),
    sender_user_id: char('sender_user_id', { length: 36 })
      .notNull()
      .references(() => users.id),
    body: text('body').notNull(),
    quote_amount: decimal('quote_amount', { precision: 10, scale: 2 }),
    created_at: timestamp('created_at').notNull().defaultNow(),
  }
);

// 14. Articles Table (CMS News)
export const articles = mysqlTable(
  'articles',
  {
    id: char('id', { length: 36 }).notNull().primaryKey(),
    author_user_id: char('author_user_id', { length: 36 })
      .notNull()
      .references(() => users.id),
    title: varchar('title', { length: 200 }).notNull(),
    slug: varchar('slug', { length: 220 }).notNull().unique(),
    content: text('content').notNull(),
    category: mysqlEnum('category', ['ECONOMIA_LEIS', 'SEGURANCA', 'MANUTENCAO']).notNull(),
    status: mysqlEnum('status', ['PUBLISHED', 'DRAFT']).notNull().default('PUBLISHED'),
    views_count: int('views_count').notNull().default(0),
    created_at: timestamp('created_at').notNull().defaultNow(),
    deleted_at: timestamp('deleted_at'),
  }
);

// 15. Community Posts Table (Forum & DIY Tutorials)
export const communityPosts = mysqlTable(
  'community_posts',
  {
    id: char('id', { length: 36 }).notNull().primaryKey(),
    user_id: char('user_id', { length: 36 })
      .notNull()
      .references(() => users.id),
    type: mysqlEnum('type', ['FORUM', 'DIY']).notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    content: text('content').notNull(),
    tags: json('tags').$type<string[]>().notNull(),
    youtube_url: varchar('youtube_url', { length: 255 }),
    likes_count: int('likes_count').notNull().default(0),
    is_hidden: boolean('is_hidden').notNull().default(false),
    created_at: timestamp('created_at').notNull().defaultNow(),
    deleted_at: timestamp('deleted_at'),
  }
);

// 16. Post Comments Table
export const postComments = mysqlTable(
  'post_comments',
  {
    id: char('id', { length: 36 }).notNull().primaryKey(),
    post_id: char('post_id', { length: 36 })
      .notNull()
      .references(() => communityPosts.id, { onDelete: 'cascade' }),
    user_id: char('user_id', { length: 36 })
      .notNull()
      .references(() => users.id),
    content: text('content').notNull(),
    created_at: timestamp('created_at').notNull().defaultNow(),
    deleted_at: timestamp('deleted_at'),
  }
);

// 17. Post Likes Table
export const postLikes = mysqlTable(
  'post_likes',
  {
    post_id: char('post_id', { length: 36 })
      .notNull()
      .references(() => communityPosts.id, { onDelete: 'cascade' }),
    user_id: char('user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.post_id, table.user_id] }),
  ]
);

// 18. Content Reports Table (Moderation)
export const contentReports = mysqlTable(
  'content_reports',
  {
    id: char('id', { length: 36 }).notNull().primaryKey(),
    target_type: mysqlEnum('target_type', ['POST', 'COMMENT']).notNull(),
    target_id: char('target_id', { length: 36 }).notNull(),
    reporter_user_id: char('reporter_user_id', { length: 36 })
      .notNull()
      .references(() => users.id),
    reason: varchar('reason', { length: 255 }).notNull(),
    status: mysqlEnum('status', ['OPEN', 'KEPT', 'HIDDEN', 'DELETED']).notNull().default('OPEN'),
    resolved_by: char('resolved_by', { length: 36 }),
    resolved_at: timestamp('resolved_at'),
    created_at: timestamp('created_at').notNull().defaultNow(),
  }
);

// 19. Audit Logs Table (Independent of FKs for permanence)
export const auditLogs = mysqlTable(
  'audit_logs',
  {
    id: char('id', { length: 36 }).notNull().primaryKey(),
    actor_user_id: char('actor_user_id', { length: 36 }).notNull(),
    impersonated: boolean('impersonated').notNull().default(false),
    action: varchar('action', { length: 100 }).notNull(),
    entity: varchar('entity', { length: 50 }).notNull(),
    entity_id: char('entity_id', { length: 36 }).notNull(),
    metadata: json('metadata'),
    ip: varchar('ip', { length: 45 }).notNull(),
    created_at: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_audit_time').on(table.created_at),
    index('idx_audit_actor').on(table.actor_user_id),
  ]
);

// 20. Search Logs Table
export const searchLogs = mysqlTable(
  'search_logs',
  {
    id: char('id', { length: 36 }).notNull().primaryKey(),
    term: varchar('term', { length: 100 }).notNull(),
    user_id: char('user_id', { length: 36 }),
    created_at: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_search_time').on(table.created_at),
  ]
);

// Relations definition for Drizzle Relational Queries
export const usersRelations = relations(users, ({ many }) => ({
  vehicles: many(vehicles),
  sessions: many(sessions),
  workshops: many(workshops),
}));

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  owner: one(users, { fields: [vehicles.user_id], references: [users.id] }),
  readings: many(vehicleReadings),
  trips: many(trips),
  alerts: many(maintenanceAlerts),
  commands: many(vehicleCommands),
}));
