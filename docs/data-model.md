# Data Model — Birth Probability Map

## Entity Relationship Diagram

```mermaid
erDiagram
    CONTINENT ||--o{ COUNTRY : contains
    COUNTRY ||--o{ BIRTH_RECORD : has

    CONTINENT {
        text code PK "AF, AS, EU, NA, OC, SA"
        text name "Africa, Asia, etc."
    }

    COUNTRY {
        text iso_alpha3 PK "ISO 3166-1 alpha-3"
        text iso_alpha2 "ISO 3166-1 alpha-2"
        text name "Common English name"
        text continent_code FK "Parent continent"
    }

    BIRTH_RECORD {
        text region_code PK "Country ISO alpha-3"
        integer year PK "1950-2024"
        integer births "Absolute birth count"
        real birth_rate "Per 1,000 people"
        real probability "births / global total"
        text data_source "UN_WPP or SAMPLE"
    }
```

## Probability Formula

```
probability(region, year) = births(region, year) / SUM(births(all, year))
```

Displayed as percentage: `0.1735 → "17.3%"`

## Views

- **country_births**: Joins birth_record + country + continent for full context
- **continent_births**: Aggregates births by continent with computed probability

## Data Volume

- ~40 countries × 75 years = ~3,000 records (sample data)
- Full UN WPP: ~200 countries × 75 years = ~15,000 records
- SQLite file: 256 KB (sample), estimated < 2 MB (full)
