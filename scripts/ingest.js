/**
 * ingest.js — Data ingestion script: download birth data → SQLite.
 *
 * Downloads UN WPP birth data (or uses bundled CSV fallback),
 * normalizes country codes, computes probabilities, and writes
 * to data/births.db.
 *
 * Usage: node scripts/ingest.js
 *        npm run ingest
 */

import initSqlJs from 'sql.js';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const DB_PATH = join(DATA_DIR, 'births.db');

// UN WPP data URL (annual births by country, 2024 revision)
const WPP_BIRTHS_URL =
  'https://population.un.org/wpp/Download/Files/1_Indicator%20(Standard)/CSV_FILES/WPP2024_Demographic_Indicators_Medium.csv';

// Continent mapping by UN M49 region
const CONTINENT_MAP = {
  'Northern Africa': 'AF', 'Eastern Africa': 'AF', 'Middle Africa': 'AF',
  'Southern Africa': 'AF', 'Western Africa': 'AF', 'Sub-Saharan Africa': 'AF',
  'Eastern Asia': 'AS', 'South-Eastern Asia': 'AS', 'Southern Asia': 'AS',
  'Central Asia': 'AS', 'Western Asia': 'AS',
  'Eastern Europe': 'EU', 'Northern Europe': 'EU', 'Southern Europe': 'EU',
  'Western Europe': 'EU',
  'Caribbean': 'NA', 'Central America': 'NA', 'Northern America': 'NA',
  'Australia and New Zealand': 'OC', 'Melanesia': 'OC', 'Micronesia': 'OC', 'Polynesia': 'OC',
  'South America': 'SA',
};

const CONTINENTS = [
  { code: 'AF', name: 'Africa' },
  { code: 'AS', name: 'Asia' },
  { code: 'EU', name: 'Europe' },
  { code: 'NA', name: 'North America' },
  { code: 'OC', name: 'Oceania' },
  { code: 'SA', name: 'South America' },
];

/** Parse CSV text into array of objects (first row = headers). */
const parseCsv = (text) => {
  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];

  // Handle quoted CSV fields
  const parseLine = (line) => {
    const fields = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; continue; }
      if (char === ',' && !inQuotes) { fields.push(current.trim()); current = ''; continue; }
      current += char;
    }
    fields.push(current.trim());
    return fields;
  };

  const headers = parseLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ''; });
    return obj;
  });
};

/** Try to fetch WPP data, fall back to generating sample data. */
const fetchBirthData = async () => {
  console.log('Attempting to download UN WPP data...');

  try {
    const response = await fetch(WPP_BIRTHS_URL, { signal: AbortSignal.timeout(30000) });
    if (response.ok) {
      const text = await response.text();
      console.log(`Downloaded ${(text.length / 1024 / 1024).toFixed(1)} MB`);
      return { source: 'UN_WPP', data: parseCsv(text) };
    }
    console.log(`Download failed (${response.status}), using fallback data`);
  } catch (err) {
    console.log(`Download failed (${err.message}), using fallback data`);
  }

  return { source: 'SAMPLE', data: null };
};

/** Generate representative sample data for development. */
const generateSampleData = () => {
  // Top countries by births with approximate historical trajectories
  const countries = [
    { iso: 'IND', name: 'India', iso2: 'IN', region: 'Southern Asia', base: 25000, growth: 1.008 },
    { iso: 'CHN', name: 'China', iso2: 'CN', region: 'Eastern Asia', base: 22000, growth: 0.985 },
    { iso: 'NGA', name: 'Nigeria', iso2: 'NG', region: 'Western Africa', base: 3000, growth: 1.025 },
    { iso: 'PAK', name: 'Pakistan', iso2: 'PK', region: 'Southern Asia', base: 4000, growth: 1.018 },
    { iso: 'IDN', name: 'Indonesia', iso2: 'ID', region: 'South-Eastern Asia', base: 5000, growth: 1.005 },
    { iso: 'USA', name: 'United States of America', iso2: 'US', region: 'Northern America', base: 4000, growth: 1.002 },
    { iso: 'BRA', name: 'Brazil', iso2: 'BR', region: 'South America', base: 3500, growth: 1.003 },
    { iso: 'BGD', name: 'Bangladesh', iso2: 'BD', region: 'Southern Asia', base: 3000, growth: 1.01 },
    { iso: 'RUS', name: 'Russian Federation', iso2: 'RU', region: 'Eastern Europe', base: 2500, growth: 0.992 },
    { iso: 'MEX', name: 'Mexico', iso2: 'MX', region: 'Central America', base: 2000, growth: 1.008 },
    { iso: 'JPN', name: 'Japan', iso2: 'JP', region: 'Eastern Asia', base: 2000, growth: 0.988 },
    { iso: 'ETH', name: 'Ethiopia', iso2: 'ET', region: 'Eastern Africa', base: 1500, growth: 1.028 },
    { iso: 'PHL', name: 'Philippines', iso2: 'PH', region: 'South-Eastern Asia', base: 1800, growth: 1.012 },
    { iso: 'EGY', name: 'Egypt', iso2: 'EG', region: 'Northern Africa', base: 1500, growth: 1.015 },
    { iso: 'COD', name: 'Democratic Republic of the Congo', iso2: 'CD', region: 'Middle Africa', base: 1000, growth: 1.03 },
    { iso: 'DEU', name: 'Germany', iso2: 'DE', region: 'Western Europe', base: 1200, growth: 0.993 },
    { iso: 'GBR', name: 'United Kingdom', iso2: 'GB', region: 'Northern Europe', base: 800, growth: 1.001 },
    { iso: 'FRA', name: 'France', iso2: 'FR', region: 'Western Europe', base: 850, growth: 1.001 },
    { iso: 'TUR', name: 'Türkiye', iso2: 'TR', region: 'Western Asia', base: 1200, growth: 1.008 },
    { iso: 'THA', name: 'Thailand', iso2: 'TH', region: 'South-Eastern Asia', base: 1000, growth: 0.998 },
    { iso: 'TZA', name: 'United Republic of Tanzania', iso2: 'TZ', region: 'Eastern Africa', base: 800, growth: 1.028 },
    { iso: 'ZAF', name: 'South Africa', iso2: 'ZA', region: 'Southern Africa', base: 900, growth: 1.005 },
    { iso: 'KEN', name: 'Kenya', iso2: 'KE', region: 'Eastern Africa', base: 700, growth: 1.025 },
    { iso: 'ITA', name: 'Italy', iso2: 'IT', region: 'Southern Europe', base: 900, growth: 0.990 },
    { iso: 'COL', name: 'Colombia', iso2: 'CO', region: 'South America', base: 800, growth: 1.005 },
    { iso: 'ARG', name: 'Argentina', iso2: 'AR', region: 'South America', base: 700, growth: 1.003 },
    { iso: 'UGA', name: 'Uganda', iso2: 'UG', region: 'Eastern Africa', base: 500, growth: 1.03 },
    { iso: 'IRQ', name: 'Iraq', iso2: 'IQ', region: 'Western Asia', base: 600, growth: 1.02 },
    { iso: 'POL', name: 'Poland', iso2: 'PL', region: 'Eastern Europe', base: 600, growth: 0.992 },
    { iso: 'CAN', name: 'Canada', iso2: 'CA', region: 'Northern America', base: 400, growth: 1.003 },
    { iso: 'AUS', name: 'Australia', iso2: 'AU', region: 'Australia and New Zealand', base: 250, growth: 1.005 },
    { iso: 'NZL', name: 'New Zealand', iso2: 'NZ', region: 'Australia and New Zealand', base: 60, growth: 1.003 },
    { iso: 'GHA', name: 'Ghana', iso2: 'GH', region: 'Western Africa', base: 500, growth: 1.02 },
    { iso: 'SDN', name: 'Sudan', iso2: 'SD', region: 'Northern Africa', base: 600, growth: 1.022 },
    { iso: 'AFG', name: 'Afghanistan', iso2: 'AF', region: 'Southern Asia', base: 500, growth: 1.025 },
    { iso: 'VNM', name: 'Viet Nam', iso2: 'VN', region: 'South-Eastern Asia', base: 1500, growth: 0.998 },
    { iso: 'IRN', name: 'Iran (Islamic Republic of)', iso2: 'IR', region: 'Southern Asia', base: 1200, growth: 0.995 },
    { iso: 'ESP', name: 'Spain', iso2: 'ES', region: 'Southern Europe', base: 650, growth: 0.991 },
    { iso: 'MMR', name: 'Myanmar', iso2: 'MM', region: 'South-Eastern Asia', base: 900, growth: 1.005 },
    { iso: 'MOZ', name: 'Mozambique', iso2: 'MZ', region: 'Eastern Africa', base: 400, growth: 1.025 },
  ];

  const records = [];
  const countryMeta = [];

  for (const c of countries) {
    const continent = CONTINENT_MAP[c.region] || 'UNKNOWN';
    countryMeta.push({
      iso_alpha3: c.iso,
      iso_alpha2: c.iso2,
      name: c.name,
      continent_code: continent,
    });

    for (let year = 1950; year <= 2024; year++) {
      const yearsFromBase = year - 1985;
      const births = Math.round(c.base * Math.pow(c.growth, yearsFromBase)) * 1000;
      records.push({
        region_code: c.iso,
        year,
        births,
        birth_rate: null,
        data_source: 'SAMPLE',
      });
    }
  }

  return { countryMeta, records };
};

/** Process WPP CSV data into normalized records. */
const processWppData = (rawData) => {
  const countryMeta = [];
  const records = [];
  const seenCountries = new Set();

  for (const row of rawData) {
    const locType = row['LocTypeName'] || row['Location type'];
    if (locType !== 'Country/Area') continue;

    const iso3 = row['ISO3_code'] || row['ISO3 Alpha-code'] || '';
    if (!iso3 || iso3.length !== 3) continue;

    const year = parseInt(row['Time'] || row['Year'], 10);
    if (Number.isNaN(year) || year < 1950 || year > 2030) continue;

    const birthsRaw = row['Births'] || row['births'] || '0';
    // UN WPP reports births in thousands
    const birthsThousands = parseFloat(birthsRaw.replace(/,/g, ''));
    if (Number.isNaN(birthsThousands)) continue;

    const births = Math.round(birthsThousands * 1000);
    const birthRate = parseFloat(row['CBR'] || row['CrudeDeathRate'] || '0') || null;
    const region = row['SubRegName'] || row['Region, subregion, country or area *'] || '';

    if (!seenCountries.has(iso3)) {
      seenCountries.add(iso3);
      const continent = CONTINENT_MAP[region] || 'UNKNOWN';
      countryMeta.push({
        iso_alpha3: iso3,
        iso_alpha2: row['ISO2_code'] || iso3.slice(0, 2),
        name: row['Location'] || row['Region, subregion, country or area *'] || iso3,
        continent_code: continent,
      });
    }

    records.push({
      region_code: iso3,
      year,
      births,
      birth_rate: birthRate,
      data_source: 'UN_WPP',
    });
  }

  return { countryMeta, records };
};

/** Compute probabilities for all records by year. */
const computeProbabilities = (records) => {
  const totalsByYear = {};
  for (const r of records) {
    totalsByYear[r.year] = (totalsByYear[r.year] || 0) + r.births;
  }
  return records.map((r) => ({
    ...r,
    probability: totalsByYear[r.year] ? r.births / totalsByYear[r.year] : 0,
  }));
};

/** Write everything to SQLite. */
const writeDatabase = async (countryMeta, records) => {
  const SQL = await initSqlJs();
  const db = new SQL.Database();

  db.run(`
    CREATE TABLE continent (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE country (
      iso_alpha3 TEXT PRIMARY KEY,
      iso_alpha2 TEXT NOT NULL,
      name TEXT NOT NULL,
      continent_code TEXT NOT NULL REFERENCES continent(code),
      un_m49_code INTEGER
    )
  `);

  db.run(`
    CREATE TABLE birth_record (
      region_code TEXT NOT NULL,
      year INTEGER NOT NULL,
      births INTEGER,
      birth_rate REAL,
      probability REAL,
      data_source TEXT NOT NULL DEFAULT 'UN_WPP',
      PRIMARY KEY (region_code, year)
    )
  `);

  db.run('CREATE INDEX idx_birth_record_year ON birth_record(year)');
  db.run('CREATE INDEX idx_birth_record_region ON birth_record(region_code)');

  // Views
  db.run(`
    CREATE VIEW country_births AS
    SELECT c.iso_alpha3, c.name AS country_name, c.continent_code,
           ct.name AS continent_name, b.year, b.births, b.birth_rate, b.probability
    FROM birth_record b
    JOIN country c ON b.region_code = c.iso_alpha3
    JOIN continent ct ON c.continent_code = ct.code
  `);

  db.run(`
    CREATE VIEW continent_births AS
    SELECT ct.code AS continent_code, ct.name AS continent_name, b.year,
           SUM(b.births) AS births,
           SUM(b.births) * 1.0 / (SELECT SUM(births) FROM birth_record WHERE year = b.year) AS probability
    FROM birth_record b
    JOIN country c ON b.region_code = c.iso_alpha3
    JOIN continent ct ON c.continent_code = ct.code
    GROUP BY ct.code, b.year
  `);

  // Insert continents
  const insertContinent = db.prepare('INSERT INTO continent (code, name) VALUES (?, ?)');
  for (const c of CONTINENTS) {
    insertContinent.run([c.code, c.name]);
  }
  insertContinent.free();

  // Insert countries
  const insertCountry = db.prepare(
    'INSERT OR IGNORE INTO country (iso_alpha3, iso_alpha2, name, continent_code) VALUES (?, ?, ?, ?)'
  );
  for (const c of countryMeta) {
    insertCountry.run([c.iso_alpha3, c.iso_alpha2, c.name, c.continent_code]);
  }
  insertCountry.free();

  // Insert birth records
  const insertBirth = db.prepare(
    'INSERT OR IGNORE INTO birth_record (region_code, year, births, birth_rate, probability, data_source) VALUES (?, ?, ?, ?, ?, ?)'
  );
  for (const r of records) {
    insertBirth.run([r.region_code, r.year, r.births, r.birth_rate, r.probability, r.data_source]);
  }
  insertBirth.free();

  const data = db.export();
  const buffer = Buffer.from(data);
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DB_PATH, buffer);

  // Stats
  const countryCount = db.exec('SELECT COUNT(*) FROM country')[0].values[0][0];
  const recordCount = db.exec('SELECT COUNT(*) FROM birth_record')[0].values[0][0];
  const yearRange = db.exec('SELECT MIN(year), MAX(year) FROM birth_record')[0].values[0];

  db.close();

  return { countryCount, recordCount, yearRange, sizeKb: Math.round(buffer.length / 1024) };
};

// Main
const main = async () => {
  console.log('Birth data ingestion starting...\n');

  const { source, data: rawData } = await fetchBirthData();

  let countryMeta, records;

  if (source === 'UN_WPP' && rawData) {
    console.log('Processing UN WPP data...');
    ({ countryMeta, records } = processWppData(rawData));
  } else {
    console.log('Generating sample data for development...');
    ({ countryMeta, records } = generateSampleData());
  }

  console.log(`Countries: ${countryMeta.length}, Raw records: ${records.length}`);

  console.log('Computing probabilities...');
  records = computeProbabilities(records);

  console.log('Writing SQLite database...');
  const stats = await writeDatabase(countryMeta, records);

  console.log('\nIngestion complete!');
  console.log(`  Database: ${DB_PATH}`);
  console.log(`  Size: ${stats.sizeKb} KB`);
  console.log(`  Countries: ${stats.countryCount}`);
  console.log(`  Records: ${stats.recordCount}`);
  console.log(`  Years: ${stats.yearRange[0]}–${stats.yearRange[1]}`);
  console.log(`  Source: ${source}`);
};

main().catch((err) => {
  console.error('Ingestion failed:', err);
  process.exit(1);
});
