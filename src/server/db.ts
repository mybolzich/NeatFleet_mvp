import { Pool, type PoolClient } from "pg";

const globalForDatabase = globalThis as unknown as { neatFleetPool?: Pool; schemaReady?: Promise<void> };

export const pool = globalForDatabase.neatFleetPool ?? new Pool({
  connectionString: process.env.DATABASE_URL ?? "postgresql://neatfleet:neatfleet@localhost:5432/neatfleet",
  max: process.env.NODE_ENV === "production" ? 10 : 4,
});

if (process.env.NODE_ENV !== "production") globalForDatabase.neatFleetPool = pool;

async function initializeSchema() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`
      CREATE TABLE IF NOT EXISTS workers (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, initials TEXT NOT NULL,
        skills TEXT[] NOT NULL DEFAULT '{}', shift_start TEXT NOT NULL, shift_end TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS vehicles (
        id TEXT PRIMARY KEY, label TEXT NOT NULL,
        capacity_units INTEGER NOT NULL CHECK (capacity_units > 0)
      );
      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY, job_code TEXT NOT NULL UNIQUE,
        kind TEXT NOT NULL CHECK (kind IN ('service','delivery','pickup','inspection','installation')),
        customer_name TEXT NOT NULL, address TEXT NOT NULL,
        lat DOUBLE PRECISION NOT NULL, lng DOUBLE PRECISION NOT NULL,
        service_minutes INTEGER NOT NULL CHECK (service_minutes > 0),
        window_start TEXT NOT NULL, window_end TEXT NOT NULL,
        required_skills TEXT[] NOT NULL DEFAULT '{}', demand_units INTEGER NOT NULL DEFAULT 1,
        priority TEXT NOT NULL CHECK (priority IN ('normal','high','urgent')),
        status TEXT NOT NULL CHECK (status IN ('unassigned','planned','in_progress','completed','exception')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS routes (
        id TEXT PRIMARY KEY, label TEXT NOT NULL,
        worker_id TEXT NOT NULL REFERENCES workers(id), vehicle_id TEXT NOT NULL REFERENCES vehicles(id),
        color TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('draft','ready','dispatched','active','completed')),
        total_distance_km DOUBLE PRECISION NOT NULL DEFAULT 0,
        total_minutes INTEGER NOT NULL DEFAULT 0, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS route_stops (
        route_id TEXT NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
        visit_id TEXT NOT NULL UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,
        sequence INTEGER NOT NULL, eta TEXT NOT NULL, travel_minutes INTEGER NOT NULL,
        PRIMARY KEY (route_id, sequence)
      );
    `);
    const result = await client.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM workers");
    if (result.rows[0].count === "0") await seedDatabase(client);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function seedDatabase(client: PoolClient) {
  await client.query(`
    INSERT INTO workers (id, name, initials, skills, shift_start, shift_end) VALUES
      ('w-1', 'Mika Santos', 'MS', ARRAY['maintenance','equipment'], '08:00', '17:00'),
      ('w-2', 'Paolo Reyes', 'PR', ARRAY['inspection','installation'], '08:30', '17:30');
    INSERT INTO vehicles (id, label, capacity_units) VALUES
      ('veh-1', 'Van 04', 12), ('veh-2', 'Van 07', 10);
    INSERT INTO jobs (id, job_code, kind, customer_name, address, lat, lng, service_minutes, window_start, window_end, required_skills, demand_units, priority, status) VALUES
      ('v-101','NF-2401','service','Luna Dental Studio','Salcedo Village, Makati',14.5586,121.0216,45,'09:00','11:00',ARRAY['equipment'],2,'urgent','unassigned'),
      ('v-102','NF-2402','inspection','Maven Coffee Roasters','Legazpi Village, Makati',14.5534,121.0171,30,'10:00','13:00',ARRAY['inspection'],1,'normal','unassigned'),
      ('v-103','NF-2403','installation','Northpoint Offices','BGC, Taguig',14.5515,121.0482,90,'13:00','16:00',ARRAY['installation'],4,'high','unassigned'),
      ('v-104','NF-2397','service','Harbor Wellness','Rockwell Center, Makati',14.5652,121.0369,40,'08:30','10:30',ARRAY['maintenance'],2,'normal','planned'),
      ('v-105','NF-2398','delivery','Aster Home','Poblacion, Makati',14.5658,121.0296,15,'10:00','12:00',ARRAY[]::TEXT[],3,'normal','planned'),
      ('v-106','NF-2399','inspection','Common Ground','Uptown, BGC',14.5565,121.0537,35,'09:00','12:00',ARRAY['inspection'],1,'high','planned'),
      ('v-107','NF-2400','pickup','Sora Kitchen','Kapitolyo, Pasig',14.5732,121.0594,20,'11:30','14:30',ARRAY[]::TEXT[],2,'normal','planned');
    INSERT INTO routes (id, label, worker_id, vehicle_id, color, status, total_distance_km, total_minutes) VALUES
      ('r-1','Central AM','w-1','veh-1','#186b58','ready',18.4,146),
      ('r-2','East Loop','w-2','veh-2','#e06b3c','draft',24.7,177);
    INSERT INTO route_stops (route_id, visit_id, sequence, eta, travel_minutes) VALUES
      ('r-1','v-104',1,'08:42',18), ('r-1','v-105',2,'09:38',16),
      ('r-2','v-106',1,'09:04',24), ('r-2','v-107',2,'10:08',29);
  `);
}

export function ensureDatabase() {
  globalForDatabase.schemaReady ??= initializeSchema();
  return globalForDatabase.schemaReady;
}

