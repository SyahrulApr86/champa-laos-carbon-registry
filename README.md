<a name="about"></a>

# Champa — Lao PDR National Carbon Registry

Champa is Lao PDR's deployment of UNDP's open-source [National Carbon Registry](https://github.com/undp/carbon-registry), configured for the Ministry of Agriculture and Environment (MAE) to track, authorize, issue, and retire carbon credits under the Decree on Carbon Credits, and to report to UNFCCC in the Agreed Electronic Format (AEF) for Article 6.

This repository is a fork of the upstream UNDP codebase (AGPL-3.0), customized with Lao PDR branding, seed accounts/organisations, and Champa-specific bug fixes. It is not the upstream project — see [undp/carbon-registry](https://github.com/undp/carbon-registry) for the generic toolkit, its release notes, and the official demo site.

<a name="this-deployment"></a>

## This deployment

```sh
docker compose up -d --build
```

- Web frontend: http://localhost:3030
- National API: http://localhost:3000/national
- Analytics API: http://localhost:3100/stats

Seed accounts come from [`organisations.csv`](./organisations.csv) and [`users.csv`](./users.csv), reloaded on every `national` service start. Demo login (DNA/Admin):

```
Email:    admin@champa.la
Password: ChampaLaos2026!
```

To restore this deployment's data exactly as it stood after the documentation was written (demo accounts, organisations, projects, uploaded documents, and every test record referenced in the [Champa docs site](https://github.com/SyahrulApr86/champa-docs)), see [`deploy-snapshot/README.md`](./deploy-snapshot/README.md).

The sections below document the shared upstream codebase (architecture, ledger, project structure, customization, API). Upstream sections this fork doesn't use — Serverless local dev, AWS Cloud deploy, ITMO Platform connectivity — have been removed; this deployment runs via Docker Compose only, as shown above.

## Index
* [About](#about)
* [This deployment](#this-deployment)
* [Standards and License](#standards)
* [Changelog](#changelog)
* [Features and User flow](#userflow)
* [Demo](#demo)
* [Architecture](#architecture)
* [Project Structure](#structure)
* [Customization Framework and Extensibility](#customization)
* [Run as Containers](#container)
* [User Onboarding](#user)
* [Web Frontend](#frontend)
* [Localization](#localization)
* [API](#api)
* [Governance & Support](#support)
* [Contributing](./CONTRIBUTING.md)
* [Community Guidelines](./COMMUNITY.md)
* [Security and Responsible Disclosure Policy](./SECURITY.md)


<a name="standards"></a>
## Standards and License
This codebase follows the digital public goods standard: https://digitalpublicgoods.net/standard/ It is built according to the Principles for Digital Development: https://digitalprinciples.org/

The tool is developed and maintained by UNDP and is licensed under the GNU Affero General Public License (AGPL-3.0), which permits free use, modification, and sharing of the software.

We kindly ask users to inform us of your usage by contacting digital4planet@undp.org, as this helps us track the tool’s impact and guide future improvements.

Under AGPL-3.0, any modifications to the code must be made publicly available by creating a new branch on GitHub. The software cannot be relicensed under more restrictive terms without adhering to the AGPL-3.0 guidelines. Developers may anonymyse or remove any sensitive or identifiable data (customisations) before resubmitting code.

<a name="changelog"></a>

## Changelog
[Learn about the latest improvements.](./CHANGES.md)

<a name="userflow"></a>
## Features and User Flow
Every country has distinct carbon market policies, processes, and governance structures and will need to customize the Carbon Registry to accommodate local needs.

The open-source code (demo version) includes the following common set of steps (features) that will be needed in most countries.

- **Initial Request Phase**: Projects aimed at reducing or removing carbon emissions sign up to the Registry and are assigned an Independent Certifier.

- **Project Authorisation**: After the Project Design Document (PDD) is reviewed, the project is officially authorised and recorded on the Registry’s Ledger.

- **Implementation Phase:** Once implemented, projects are monitored, and emissions reductions are reported. Carbon credits can be issued and serialised following verification.

- **Credit Transfer/Retirement:** Issued credits can be traded domestically or internationally. Credits can be tracked, retired, or cancelled within the Registry, ensuring proper ownership transfer and preventing double counting.

Key features of the software include:
-  **Updated default Serial Numbers**: Each Carbon Credit Document has a Serial Number (ID). The Demo Carbon Registry is aligned to UNFCCC's Article 6.4 Guidance Decision 5/CMA.4 This can be adapted to other types of Carbon Credits.

-  **Reporting module**: The Registry automatically generates reports in the Agreed Electronic Format (AEF) for Article 6.2 of the Paris Agreement.

-  **Ledger**: All Transfers, Retirements, and Cancellations are immutably recorded onto a ledger.

-  **Dashboard**: An Interactive Dashboard visualizes the history of credits Issued, transferred, and active projects — by country, geography, and organizations.

-  **Interoperable & Exportable Data**: The Data Model is aligned with the CAD Trust data standard and the ITMO Registry Standard Connection Platform. An Open RESTful API Allows for Additional Integrations and Innovation.

<a name="demo"></a>
## Demo Site
For this fork, run it locally with `docker compose up -d --build` (see [This deployment](#this-deployment) above) — there is no hosted Champa demo site. UNDP separately hosts a generic demo at https://www.demo.carbreg.org/login for the upstream toolkit; contact the UNDP DPG team to request a walkthrough of that one.

<a name="architecture"></a>

## System Architecture

UNDP Carbon Registry is based on service oriented architecture (SOA). Following diagram visualize the basic components in the system.

![alt text](./documention/imgs/System%20Architecture.svg)

<a name="services"></a>

### **System Services**

#### _National Service_

Authenticate, Validate and Accept user (DNA, Project Developer/Certifier) API requests related to the following functionalities,

- User and company CRUD operations.
- User authentication.
- Project life cycle management.
- Credit life cycle management.

Service is horizontally scalable and state maintained in the following locations,

- File storage.
- Operational Database.
- Ledger Database.

Uses the Serial Number Generator service to issue a serial number and track credits through any transaction.
Uses Ledger interface to persist project and credit life cycles.

#### _Analytics Service_

Serve all the system analytics. Generate all the statistics using the operational database.
Horizontally scalable.

#### _Replicator Service_

Asynchronously replicate ledger database events in to the operational database. During the replication process it injects additional information to the data for query purposes (Eg: Location information).
Currently implemented for QLDB and PostgresSQL ledgers. By implementing [replicator interface](./backend/services/src/ledger-replicator/replicator-interface.service.ts) can support more ledger replicators.
Replicator select based on the `LEDGER_TYPE` environment variable. Support types `QLDB`, `PGSQL(Default)`.

### **Serial Number Generation And Tracking**

The UNDP demo registry will generate and record a unique Project ID for each project for credit issuance, where each credit will receive a distinct Credit ID (serial number). The Credit ID (serial number) format aligns with UNFCCC guidance on ITMO ID formatting, as outlined in Decision 6/CMA.4, paragraph 17. This ensures that the system is designed to generate ITMO IDs by default in accordance with UNFCCC standards.

<img src="./documention/imgs/SerialNumberFormat.png" alt="Serial Number Format" width="600"/>

#### _Project Authorization_

A unique project identifier is created for the project. It consists upto the project ID section of the serial number format.<br>
Example: CA0004-VU-CH-356

#### _Credit Issuance_

A batch of credits is issued each time a project undergoes monitoring and verification. Issuance may include multiple vintages.<br>
Example:

- In January 2024, Batch 1 with 3,000 total credits is issued, vintage of 2023.The start and end block number: 1-3000. Serial number for credits: CA0004-VU-CH-356-1-3000-2023
- In January 2025, Batch 2 with 2,000 credits is issued, vintage 2024. The start and end block number: 3001-5000. Serial number for credits: CA0004-VU-CH-356-3001-5000-2024

#### _Credit Transfer or Retire_

When credits are Tranferred or Retired, it can be a transaction of a full block or a partial amount of a block.<br>

- When a full block transfer happens, the ownership of the credit block change accordingly. Credit balances of both companies should be updated to reflect the ownership change.<br>
  Example: Transfer of 3000 credits from CA0004-VU-CH-356-1-3000-2023 block.<br>
  Before transaction: CA0004-VU-CH-356-1-3000-2023 : Owner 1<br>
  After transaction: CA0004-VU-CH-356-1-3000-2023 : Owner 2
- When partial block transfer happens, the current owner always retains the first serial number block and gives away the last serial number block.<br>
  Example: Transfer of 1000 credits from CA0004-VU-CH-356-1-3000-2023 block.<br>
  Before transaction: CA0004-VU-CH-356-1-3000-2023 : Owner 1<br>
  After transaction: CA0004-VU-CH-356-1-2000-2023 : Owner 1 and CA0004-VU-CH-356-2001-3000-2023 : Owner 2

### **Deployment**

Each service boundary is containerized into a Docker container. [See the Docker Compose file](./docker-compose.yml) and [Run as Containers](#container) below.

### **External Service Providers**

All the external services access through a generic interface. It will decouple the system implementation from the external services and enable extendability to multiple services.

**Geo Location Service**

Currently implemented for 2 options.

1. File based approach. User has to manually add the regions with the geo coordinates. [Sample File](./backend/services/regions.csv). To apply new file changes, replicator service needs to restart.
2. [Mapbox](https://mapbox.com). Dynamically query geo coordinates from the Mapbox API.
3. OpenStreetMap. No API key required.

Can add more options by implementing [location interface](./backend/services/libs/shared/src/location/location.interface.ts)

Change by environment variable `LOCATION_SERVICE`. Supported types `MAPBOX`, `OPENSTREET`, `FILE(Default)`. This deployment uses `FILE` for the `national` service and `OPENSTREET` for the `replicator` service (see `docker-compose.yml`).

**File Service**

Implemented 2 options for static file hosting.

1. NestJS static file hosting using the local storage and container volumes.
2. AWS S3 file storage.

Can add more options by implementing [file handler interface](./backend/services/libs/shared/src/file-handler/filehandler.interface.ts)

Change by environment variable `FILE_SERVICE`. Supported types `S3`, `LOCAL(Default)`

### **Database Architecture**

Primary/secondary database architecture used to store carbon project and account balances.
Ledger database is the primary database. Add/update projects and update account balances in a single transaction. Currently implemented only for AWS QLDB

Operational Database is the secondary database. Eventually replicated to this from primary database via data stream. Implemented based on PostgresSQL

**Why Two Database Approach?**

1. Cost and Query capabilities - Ledger database (blockchain) read capabilities can be limited and costly. To support rich statistics and minimize the cost, data is replicated in to a cheap query database.
2. Disaster recovery
3. Scalability - Primary/secondary database architecture is scalable since additional secondary databases can be added as needed to handle more read operations.

**Why Ledger Database?**

1. Immutable and Transparent - Track and maintain a sequenced history of every carbon project and credit change.
2. Data Integrity (Cryptographic verification by third party).
3. Reconcile carbon credits and company account balance.

**Ledger Database Interface**

This enables the capability to add any blockchain or ledger database support to the carbon registry without functionality module changes. Currently implemented for PostgresSQL and AWS QLDB.

**PostgresSQL Ledger Implementation** storage all the carbon project and credit events in a separate event database with the sequence number. Support all the ledger functionalities except immutability.

Single database approach used for user and company management.

### **Ledger Layout**

Carbon Registry contains 2 ledger tables.

1. Project ledger - Contains all the project and credit transactions.
2. Credit Blocks Ledger (Credit) - Contains credit blocks, transactions and ownership.

The below diagram demonstrates the ledger behavior of project create, authorise, issue and transfer processes. Blue color document icon denotes a single data block in a ledger.

![alt text](./documention/imgs/Ledger.png)

### **Authentication**

- JWT Authentication - All endpoints based on role permissions.
- API Key Authentication - MRV System connectivity.

<a name="structure"></a>

## Project Structure

    .
    ├── .github                         # CI/CD [Github Actions workflows, CODEOWNERS]
    ├── backend                         # System service implementation
        ├── services                    # Services implementation [NestJS application]
            ├── src
                ├── national-api        # National API [NestJS module]
                ├── analytics-api       # Analytics/statistics API [NestJS module]
                ├── ledger-replicator   # Blockchain Database data replicator [QLDB to Postgres]
                ├── async-operations-handler  # Background job processing
                ├── data-importer       # External data import (e.g. ITMO Platform, unused here)
                ├── demo-seeder         # Synthetic demo data generator (see below)
            ├── libs
                ├── core                # System and database configurations
                ├── shared              # Shared resources [NestJS module]
            ├── organisations.csv       # Base seed organisations
            ├── users.csv               # Base seed users
    ├── web                             # System web frontend implementation [React + TypeScript + Vite]
    ├── deploy-snapshot                 # Point-in-time DB + filestore snapshot for this deployment (see below)
    ├── .gitignore
    ├── docker-compose.yml              # Docker container definitions
    └── README.md

<a name="customization"></a>

## Customization Framework and Extensibility

The registry is designed so that deployments can be tailored to different national frameworks, market designs, and operational needs. The following describes how the system supports customization and extension in an implementation-agnostic way.

### 1. Functional Customization

Core business logic can be adapted to reflect national or regional requirements:

- **Workflows and approval processes:** Project lifecycle stages, authorization steps, and approval chains (e.g. Designated National Authority, certifiers, project developers) can be configured or extended to match local governance and decision-making rules.
- **Sector and classification logic:** Sector classifications, sectoral scopes, mitigation types, and related taxonomies can be adjusted so that projects and credits align with national or international classification frameworks.
- **Registry rules:** Rules governing credit issuance, transfer, retirement, and cancellation—including validation and business checks—can be adapted to reflect different market designs and compliance requirements.

Customization is supported through shared domain logic, configurable enumerations, and service interfaces that allow alternative implementations without changing the core application flow.

### 2. UI & Configuration Customization

The user interface and presentation layer can be adapted for different deployments:

- **Controlled vocabularies and dropdowns:** Options for sectors, mitigation types, document types, statuses, and other fixed lists are driven by enumerations and configuration. Updating these sources allows dropdowns and selection fields to reflect national or deployment-specific terminology and values without altering core UI components.
- **Branding:** Logos, color schemes, and key labels can be changed via configuration and asset replacement. Theme colors, primary branding elements, and public-facing text can be aligned with national or institutional branding.
- **Forms and data fields:** Form definitions, field labels, validation rules, and optional versus mandatory fields can be extended or reconfigured so that data capture matches local reporting and regulatory needs, while preserving the underlying data model where required for interoperability.

Localization (see [Localization](#localization)) supports multiple languages and can be extended with new translation namespaces for both the core application and customized labels.

### 3. Module Extensibility

The system supports adding and composing functionality in a modular way:

- **New functionality:** New features can be added as separate modules or services, registered with the runtime (e.g. via environment or deployment configuration), and integrated with existing APIs and the frontend where needed.
- **Extending existing modules:** Existing modules (e.g. national API, analytics, replicator, data import) are structured so that new behaviour can be added through additional handlers, optional steps, or pluggable implementations of defined interfaces.
- **Optional components:** Optional capabilities—such as analytics, external data import, verification support, or safeguards-related modules—can be enabled or disabled per deployment. The codebase uses interfaces and dependency injection so that optional components can be swapped or omitted without changing core services.

Documentation on integrating and listing module integrations is maintained in the repository (e.g. under `modules/`). Implementing the relevant interfaces (e.g. ledger replicator, location service, file handler, data importer) allows new backends or integrations to be added in a consistent way.

### 4. Data Integration & Interoperability

The registry is built to integrate with external systems and support standardized data exchange:

- **External registries:** Connections to other national or international registries can be implemented via API clients or import/export modules. The system supports synchronization of projects and credits with external platforms through defined workflows and field mappings, enabling alignment with international reporting and trading requirements.
- **API- and file-based exchange:** REST APIs expose project, credit, company, and user operations for system-to-system integration. File-based exchange (e.g. CSV, structured formats) is supported for bulk data and reference data (e.g. regions, organisations). Data export services support standardized reporting formats (e.g. Agreed Electronic Format) for compliance and interoperability.
- **Third-party systems:** Integration with MRV systems, verification bodies, and other information systems is possible through API authentication (e.g. API keys, JWT) and documented endpoints. The data model is aligned with common standards (e.g. CAD Trust, ITMO-related formats) to simplify integration with third-party tools.
- **Visualization and geospatial data:** Map and dashboard components consume location and project data; geospatial layers and visualizations can be extended by providing location services (e.g. file-based region lists or external geocoding APIs) and by adding or customizing analytics and dashboard modules.

### 5. Configuration Files & Customization Points

The main customization touchpoints in the repository are organized as follows:

| Area | Location / description |
|------|------------------------|
| **Frontend configuration** | `web/src/Config/` — API base URLs, theme colors, routing. |
| **Theme and branding** | `web/src/Config/colorConfigs.ts`, `web/src/Styles/` (SCSS variables and theme files), `web/public/` (logos, favicon, fonts). |
| **Controlled vocabularies (UI)** | `web/src/Definitions/Enums/` — enumerations for sectors, mitigation types, roles, statuses, and other dropdowns. |
| **Backend enumerations and constants** | `backend/services/libs/shared/src/enum/`, `backend/services/libs/shared/src/constants/` — server-side vocabularies and constants. |
| **DTOs and validation** | `backend/services/libs/shared/src/dto/` — request/response shapes and validation rules that affect API contracts and form behaviour. |
| **Reference data** | `backend/services/countries.json`, `backend/services/regions.csv` (or equivalent path) — countries and geographic regions used by setup and location services. |
| **Service selection** | Environment variables (e.g. `RUN_MODULE`, `LEDGER_TYPE`, `LOCATION_SERVICE`, `FILE_SERVICE`) — which modules and implementations are active. |
| **Deployment and infrastructure** | `docker-compose.yml` — service composition and container configuration. |
| **Localization** | `web/public/locales/` — translation files per language and namespace. |

Schema definitions, entity and view definitions, and ledger interfaces live under `backend/services/libs/shared/src/` (entities, view-entities, ledger-db, etc.) and define the core data model; extensions or country-specific overrides can be introduced via configuration packages or additional modules that consume these interfaces.

### 6. Developer Guidance

Developers customizing or extending the registry can use the following approach:

- **Creating a configuration package for a country or deployment:** Gather all deployment-specific settings in one place: copy or extend the relevant config files (e.g. from `web/src/Config/`), enumerations (frontend and backend), reference data (countries, regions), and environment variables. Optionally use a dedicated folder or branch for “country X config” that overrides only these files, leaving the rest of the codebase unchanged. Document the chosen country code, default language, and any feature flags or disabled modules.
- **Registering new modules or overriding defaults:** To add a new optional module (e.g. a new data importer or analytics provider), implement the appropriate interface (e.g. importer, replicator, location, file-handler) in the backend, register it in the relevant module (e.g. replicator or data-importer), and enable it via `RUN_MODULE` or equivalent environment configuration. To override default behaviour, provide a new implementation of the same interface and select it via the corresponding environment variable (e.g. `LOCATION_SERVICE`, `FILE_SERVICE`).
- **Contributing new customization capabilities:** When adding a new customization point (e.g. a new config file, enum set, or feature flag), keep it in the locations indicated above (Config, Enums, constants, reference data, or deployment config). Prefer configuration and interfaces over hard-coded branches; document the new option in the README or in a dedicated docs file, and update this section if it introduces a new category of customization.

For contribution and licensing terms, see [Standards and License](#standards) and [Governance and Support](#support).

<a name="container"></a>

## Run Services As Containers

- Update [docker compose file](./docker-compose.yml) env variables as required.
  - Currently all the emails are disabled using env variable `IS_EMAIL_DISABLED`. When the emails are disabled email payload will be printed on the console. User account passwords needs to extract from this console log. Including root user account, search for a log line starting with `Password (temporary)` on national container (`docker logs -f undp-carbon-registry-national-1`).
  - Add / update following environment variables to enable email functionality.
    - `IS_EMAIL_DISABLED`=false
    - `SOURCE_EMAIL` (Sender email address)
    - `SMTP_ENDPOINT`
    - `SMTP_USERNAME`
    - `SMTP_PASSWORD`
  - Use `DB_PASSWORD` env variable to change PostgresSQL database password
  - Configure system root account email by updating environment variable `ROOT EMAIL`. If the email service is enabled, on the first docker start, this email address will receive a new email with the root user password.
  - This deployment renders maps with MapLibre + OpenStreetMap (no API key required), set via `VITE_APP_MAP_TYPE=MapLibre` on the `web` build. Upstream also supports Mapbox by setting `VITE_APP_MAP_TYPE=Mapbox` and adding `VITE_APP_MAPBOXGL_ACCESS_TOKEN` with a [MapBox public access token](https://docs.mapbox.com/help/tutorials/get-started-tokens-api/), but this fork does not use it. Note the frontend build uses Vite (`VITE_APP_*`), not Create React App (`REACT_APP_*`).
- Add user data
  - Update [organisations.csv](./organisations.csv) file to add organisations.
  - Update [users.csv](./users.csv) file to add users.
  - When updating files keep the header and replace existing dummy data with your data.
  - These users and companys add to the system each docker restart.
- Run `docker-compose up -d --build`. This will build and start containers for following services,
  - PostgresDB container
  - National service
  - Analytics service
  - Replicator service
  - React web server with Nginx.
- Web frontend on http://localhost:3030/
- API Endpoints,
  - http://localhost:3000/national#/
  - http://localhost:3100/stats#/

<a name="user"></a>

## User Onboarding and Permissions Model

### User Roles

System pre-defined user roles are as follows,

- Root
- Company Level (DNA, Project and Certification Company come under this level)
  - Admin
  - Manager
  - View Only

### User Onboarding Process

1. After the system setup, the system have a Root User for the setup email (one Root User for the system)
2. Root User is responsible for creating the DNA entity and the Admin of the DNA
3. The DNA Admin is responsible for creating the other companies and Admins of each company.
4. Admin of the company has the authority to add the remaining users (Admin, Managers, View Only Users) to the company.
5. When a user is added to the system, a confirmation email should be sent to users including the login password.

### User Management

All the CRUD operations can be performed as per the following table,

| Company Role            | New User Role                 | Authorized User Roles (Company)                                                                     |
| ----------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------- |
| DNA                     | Root                          | Cannot create new one other than the default system user and Can manage all the users in the system |
| DNA                     | Admin<br>Manager<br>View Only | Root<br>Admin(DNA)                                                                                  |
| All other Company Roles | Admin<br>Manager<br>View Only | Root<br>Admin(DNA)<br>Admin(Company)                                                                |

- All users can edit own user account except Role and Email.
- Users are not allowed to delete the own account from the system.

<a name="frontend"></a>

### Web Frontend

Web frontend implemented using React + TypeScript, built with Vite (not Create React App — build-time config uses `VITE_APP_*` env variables). See [`web/README.md`](./web/README.md).

<a name="localization"></a>

### Localization

The language switcher offers English, Español, Français, and ລາວ (Lao) — this deployment added the Lao translation on top of upstream's English/Spanish/French.

Translation files live under `web/public/locales/i18n/<namespace>/<locale>.json` (e.g. `common/lo.json`). Please refer [here](./web/public/locales/i18n/README.md) for adding a new language translation file.

<a name="api"></a>

### Application Programming Interface (API)

For integration, reference RESTful Web API Documentation documentation via Swagger. To access

- National API: api.APP_URL/national
- Status API: api.APP_URL/stats

<a name="resource"></a>

### Resource Requirements

| Resource |                                            Minimum | Recommended |
| :------- | -------------------------------------------------: | ----------: |
| Memory   |                                               4 GB |        8 GB |
| CPU      |                                            4 Cores |     4 Cores |
| Storage  |                                              20 GB |       50 GB |
| OS       | Linux <br> Windows Server 2016 and later versions. |             |

Note: Above resource requirement mentioned for a single instance from each microservice.

<a name="support"></a>

### Governance and Support

The United Nations Development Program (UNDP) is responsible for managing the application. To ensure alignment with international demand, Digital For Climate (D4C) will act as an advisory body to the Digital Public Good Carbon Registry codebase. D4C is a collaboration between [European Bank for Reconstruction and Development (EBRD)](https://www.ebrd.com), [United Nations Development Program (UNDP)](https://www.undp.org), [United Nations Framework Convention on Climate Change (UNFCCC)](https://www.unfccc.int), [International Emissions Trading Association (IETA)](https://www.ieta.org), [European Space Agency (ESA)](https://www.esa.int), and [World Bank Group](https://www.worldbank.org)  that aims to coordinate respective workflows and create a modular and interoperable end-to-end digital ecosystem for the carbon market. The overarching goal is to support a transparent, high integrity global carbon market that can channel capital for impactful climate action and low-carbon development.


This code is managed by UNDP as custodian. For technical questions about the upstream toolkit, visit the community of practice [Keeping Track of the Paris Agreement](https://www.sparkblue.org/group/keeping-track-digital-public-goods-paris-agreement) or the [open forum](https://github.com/undp/carbon-registry/discussions). For questions about this specific fork or deployment, use this repository's own issue tracker.

See [CONTRIBUTING.md](./CONTRIBUTING.md), [COMMUNITY.md](./COMMUNITY.md), and [SECURITY.md](./SECURITY.md) (linked in the [Index](#about) above) for contribution workflow, community roles, and responsible disclosure. Maintainer responsibility by area of the codebase is defined in [`.github/CODEOWNERS.md`](.github/CODEOWNERS.md).

## Glossary

| Term | Definition |
| --- | --- |
| **AEF** | Agreed Electronic Format: a standardised reporting format for Article 6.2 credits. |
| **DNA** | Designated National Authority: national body responsible for approving projects and credit transfers. |
| **IC** | Independent Certifier: entity that validates and verifies mitigation projects. |
| **Serial Number** | Unique identifier assigned to a batch of credits or projects. |
| **MRV** | Monitoring, Reporting and Verification: the process used to track emission reductions. |
