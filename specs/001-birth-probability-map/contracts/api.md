# API Contracts: Birth Probability Map

**Date**: 2026-03-17

## Endpoints

### GET /api/births

Returns birth probability data for a given year and granularity level.

**Query parameters**:

| Param  | Type    | Required | Default   | Description                        |
|--------|---------|----------|-----------|------------------------------------|
| year   | integer | no       | latest    | Calendar year (1950–present)       |
| level  | string  | no       | "country" | "country" or "continent"           |

**Response** (200 OK):

```json
{
  "year": 2020,
  "level": "country",
  "total_births": 140110000,
  "regions": [
    {
      "code": "IND",
      "name": "India",
      "continent": "AS",
      "births": 24316000,
      "probability": 0.1735,
      "birth_rate": 17.4
    },
    {
      "code": "CHN",
      "name": "China",
      "continent": "AS",
      "births": 12020000,
      "probability": 0.0858,
      "birth_rate": 8.5
    }
  ]
}
```

**Response** (400 Bad Request):

```json
{
  "error": "Invalid year. Must be between 1950 and 2024."
}
```

---

### GET /api/years

Returns the range of available years in the dataset.

**Response** (200 OK):

```json
{
  "min_year": 1950,
  "max_year": 2024,
  "count": 75
}
```

---

### GET /data/download

Exports birth data as CSV.

**Query parameters**:

| Param  | Type    | Required | Default   | Description                        |
|--------|---------|----------|-----------|------------------------------------|
| year   | integer | no       | all       | Filter to specific year            |
| level  | string  | no       | "country" | "country" or "continent"           |

**Response** (200 OK): `Content-Type: text/csv`

```csv
region_code,region_name,continent,year,births,probability,birth_rate
IND,India,AS,2020,24316000,0.1735,17.4
CHN,China,AS,2020,12020000,0.0858,8.5
```

**Headers**:
- `Content-Disposition: attachment; filename="births-2020-country.csv"`

---

### POST /api/query

Executes a read-only SQL query against the birth database.

**Request body**:

```json
{
  "sql": "SELECT * FROM country_births WHERE year = 2020 ORDER BY probability DESC LIMIT 10"
}
```

**Response** (200 OK):

```json
{
  "columns": ["iso_alpha3", "country_name", "continent_code", "continent_name", "year", "births", "birth_rate", "probability"],
  "rows": [
    ["IND", "India", "AS", "Asia", 2020, 24316000, 17.4, 0.1735],
    ["CHN", "China", "AS", "Asia", 2020, 12020000, 8.5, 0.0858]
  ],
  "row_count": 2,
  "duration_ms": 12
}
```

**Response** (400 Bad Request):

```json
{
  "error": "Only SELECT statements are allowed."
}
```

**Security constraints**:
- Only `SELECT` statements are permitted.
- Queries that begin with `INSERT`, `UPDATE`, `DELETE`, `DROP`,
  `ALTER`, `CREATE`, or `PRAGMA` MUST be rejected.
- Query execution timeout: 5 seconds.

---

### GET /data/console

Serves the SQL console HTML page. No API contract — this is a
static page that uses `/api/query` for execution.

---

## Common Response Headers

All API responses include:
- `Content-Type: application/json` (except CSV download)
- `Cache-Control: public, max-age=86400` (data changes only on deploy)
- `Access-Control-Allow-Origin: *` (public data)

## Error Format

All errors follow:

```json
{
  "error": "Human-readable error message"
}
```

HTTP status codes: 200 (success), 400 (bad request), 500 (server error).
