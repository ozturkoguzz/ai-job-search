# Search Queries for Job Scraper

## Installed portal CLIs (primary for `/scrape`)

`/scrape` discovers every portal skill under `.agents/skills/*/SKILL.md` and runs its CLI first. Shipped country-agnostic CLIs include `linkedin-search` and `freehire-search`.

The `site:` query templates in this file are the **WebSearch fallback** — for portals without a CLI, company career pages, or when a CLI fails.

**Language scope:** English only.

## Target Role Titles

- Data Engineer
- Senior Data Engineer
- Big Data Engineer
- ETL Developer
- Data Pipeline Engineer
- Cloud Data Engineer
- Data Platform Engineer
- Analytics Engineer
- Data Architect

**Excluded:** Staff, Lead, Principal, ML Engineer, MLOps.

## Search Profiles

1. 🇩🇪 Germany — English-language roles only
2. 🇦🇪 UAE — all roles
3. 🇬🇧 UK — all roles
4. 🇨🇭 Switzerland — English-language roles only
5. 🇱🇺 Luxembourg — English-language roles only

## Search Sites

Primary:
- **linkedin.com/jobs** — `linkedin-search` CLI
- **freehire.io** — `freehire-search` CLI

Per-country (add via `/add-portal`):
- **stepstone.de**, **indeed.de** — Germany
- **bayt.com**, **gulftalent.com** — UAE
- **indeed.co.uk**, **reed.co.uk**, **totaljobs.com** — UK
- **jobs.ch**, **swissdevjobs.ch** — Switzerland
- **indeed.lu**, **moovijob.com** — Luxembourg

## Query Categories

### Priority 1: Core Data Engineering Titles

**LinkedIn (all markets):**
```
site:linkedin.com/jobs "Data Engineer" Germany
site:linkedin.com/jobs "Senior Data Engineer" Germany
site:linkedin.com/jobs "Big Data Engineer" Germany
site:linkedin.com/jobs "ETL Developer" Germany
site:linkedin.com/jobs "Data Pipeline Engineer" Germany
site:linkedin.com/jobs "Cloud Data Engineer" Germany
site:linkedin.com/jobs "Data Engineer" Berlin OR Munich OR Hamburg OR Frankfurt
site:linkedin.com/jobs "Data Engineer" Dubai OR "Abu Dhabi"
site:linkedin.com/jobs "Senior Data Engineer" UAE
site:linkedin.com/jobs "Big Data Engineer" UAE
site:linkedin.com/jobs "ETL Developer" UAE
site:linkedin.com/jobs "Data Engineer" London OR Manchester OR Edinburgh
site:linkedin.com/jobs "Senior Data Engineer" "United Kingdom"
site:linkedin.com/jobs "Big Data Engineer" "United Kingdom"
site:linkedin.com/jobs "ETL Developer" "United Kingdom"
site:linkedin.com/jobs "Cloud Data Engineer" "United Kingdom"
site:linkedin.com/jobs "Data Engineer" Zurich OR Geneva OR Basel
site:linkedin.com/jobs "Senior Data Engineer" Switzerland
site:linkedin.com/jobs "Big Data Engineer" Switzerland
site:linkedin.com/jobs "Data Engineer" Luxembourg
site:linkedin.com/jobs "Senior Data Engineer" Luxembourg
```

**Indeed (per country):**
```
site:indeed.de "Data Engineer" English
site:indeed.de "Senior Data Engineer" English
site:indeed.de "Big Data Engineer" English
site:indeed.de "ETL Developer" English
site:indeed.co.uk "Data Engineer"
site:indeed.co.uk "Senior Data Engineer"
site:indeed.co.uk "Big Data Engineer"
site:indeed.co.uk "ETL Developer"
site:indeed.co.uk "Data Pipeline Engineer"
site:indeed.ae "Data Engineer" Dubai
site:indeed.ae "Senior Data Engineer"
site:indeed.ch "Data Engineer" English
site:indeed.lu "Data Engineer"
```

**Country-specific boards:**
```
site:stepstone.de "Data Engineer" English
site:stepstone.de "Big Data Engineer" English
site:stepstone.de "ETL Developer" English
site:bayt.com "Data Engineer" Dubai OR "Abu Dhabi"
site:gulftalent.com "Data Engineer" UAE
site:reed.co.uk "Data Engineer"
site:reed.co.uk "Senior Data Engineer"
site:totaljobs.com "Data Engineer"
site:jobs.ch "Data Engineer" English
site:swissdevjobs.ch "Data Engineer"
site:moovijob.com "Data Engineer" Luxembourg
```

### Priority 2: Data Platform & Architecture

```
site:linkedin.com/jobs "Data Platform Engineer" Germany OR UK OR UAE OR Switzerland OR Luxembourg
site:linkedin.com/jobs "Analytics Engineer" Germany OR UK OR UAE OR Switzerland OR Luxembourg
site:linkedin.com/jobs "Data Architect" Germany OR UK OR UAE OR Switzerland OR Luxembourg
site:linkedin.com/jobs "Cloud Data Engineer" Germany OR UK OR UAE OR Switzerland
```

### Priority 3: Keyword-based (tech stack match)

```
site:linkedin.com/jobs Kafka Spark "Data Engineer" Germany OR UK
site:linkedin.com/jobs Airflow dbt "Data Engineer" Germany OR UK OR Switzerland
site:linkedin.com/jobs Databricks "Data Engineer" Germany OR UK OR UAE
site:linkedin.com/jobs "Data Mesh" engineer Germany OR UK
site:linkedin.com/jobs "real-time" "data pipeline" Germany OR UK OR UAE
```

### Priority 4: Target Company Career Pages

**Germany:**
```
site:n26.com/careers "Data Engineer"
site:deliveryhero.com/careers "Data Engineer"
site:jobs.zalando.com "Data Engineer"
site:sap.com/careers "Data Engineer"
site:careers.siemens.com "Data Engineer"
site:flixbus.com/careers "Data Engineer"
```

**UAE:**
```
site:careem.com/careers "Data Engineer"
site:noon.com/careers "Data Engineer"
site:talabat.com/careers "Data Engineer"
```

**UK:**
```
site:careers.revolut.com "Data Engineer"
site:monzo.com/careers "Data Engineer"
site:careers.wise.com "Data Engineer"
site:deliveroo.com/careers "Data Engineer"
```

**Switzerland:**
```
site:careers.google.com "Data Engineer" Zurich
site:ubs.com/careers "Data Engineer"
```

**Luxembourg:**
```
site:amazon.jobs "Data Engineer" Luxembourg
site:careers.pwc.com "Data Engineer" Luxembourg
```

## Exclusion Keywords

**Exclude any job posting whose description contains these keywords/phrases:**

- `Snowflake` — not in tech stack, skip Snowflake-centric roles
- `Deutsch` — indicates German-language requirement
- `Deutsch-` — compound German-language terms (e.g. Deutsch-Kenntnisse)
- `Deutschkenntnisse` — "German language skills required"
- `fließend Deutsch` — "fluent German"
- `Muttersprache Deutsch` — "native German"
- `verhandlungssicher Deutsch` — "business-fluent German"
- `auf Deutsch` — "in German"

**How to apply:** When scraping results, scan job description text for these keywords. If any match is found, exclude the posting from results. This is a post-scrape filter — apply after fetching, before ranking.

**Note:** These are description-level filters. A posting title in English with German-language requirements buried in the description should still be caught and excluded.

## Location Filter

### Germany
- All German cities ✅ (if English-language)
- Remote from Germany ✅

### UAE
- Dubai, Abu Dhabi ✅
- Other emirates: FLAG

### UK
- London, Manchester, Edinburgh, Birmingham, Bristol, Cambridge ✅
- Remote from UK ✅

### Switzerland
- Zurich, Geneva, Basel, Bern ✅
- Remote from Switzerland ✅

### Luxembourg
- Luxembourg City ✅
- Remote from Luxembourg ✅

## Language Filter

**English-language postings only across all profiles.**

- English required → PASS (C1)
- Turkish required → PASS (Native)
- German B2+ required → FLAG (have A2)
- German A2/basic → PASS
- French required → FAIL
- Arabic required → FAIL
- Any other language required → FAIL

## Date Filter

Jobs posted within last 14 days, or open deadline. Unknown date → include but flag.

## Adapting Queries

- "/scrape germany" → Profile 1 only
- "/scrape uae" → Profile 2 only
- "/scrape uk" → Profile 3 only
- "/scrape switzerland" → Profile 4 only
- "/scrape luxembourg" → Profile 5 only
- "/scrape all" → All profiles
