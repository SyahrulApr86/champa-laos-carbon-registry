# Champa — Lao PDR National Carbon Registry

## About

**Champa** is the Lao People's Democratic Republic (Lao PDR) national deployment of the [UNDP National Carbon Registry](https://github.com/undp/carbon-registry), a Digital Public Good originally developed and maintained by UNDP. The name references *Dok Champa* (ດອກຈຳປາ), the national flower of Laos.

This repository is a fork of the upstream project, customized specifically to meet Lao PDR's national requirements for tracking, recording, issuing, monitoring, and trading carbon credits under Article 6 of the Paris Agreement.

Like the upstream project, Champa is licensed under the **GNU Affero General Public License (AGPL-3.0)**. All modifications in this fork remain publicly available under the same license terms — see the original [README.md](./README.md) for the full standards, license, and attribution details.

## Customizations for Lao PDR

The following customizations are being made to adapt the base registry for Lao PDR. This list is a work in progress and will be filled in as customization work lands.

- **Ministry / Sector configuration**: _TODO — document Lao PDR-specific ministry, DNA (Designated National Authority), and sector/sectoral scope configuration._
- **Lao language (ພາສາລາວ) localization**: _TODO — document Lao language translation namespaces and locale files added under `web/public/locales/`._
- **NFMS (National Forest Monitoring System) integration**: _TODO — document integration points, data mapping, and environment variables for connecting to Laos' NFMS._
- **Branding**: _TODO — document logo, favicon, color scheme, and product naming changes (see `web/src/Config/colorConfigs.ts` and `web/public/`)._

## Running Locally

Champa follows the same deployment process as the upstream registry. Please follow the **[Run Services As Containers](./README.md#run-services-as-containers)** section in the main [README.md](./README.md) for the full Docker Compose setup instructions (environment variables, `docker-compose up -d --build`, service ports, etc.).

Lao-specific notes:

- _TODO — document any additional environment variables required for Lao PDR deployment (e.g. NFMS integration credentials, Lao locale defaults, ministry-specific configuration)._

## Credits

Based on the **UNDP National Carbon Registry**, a Digital Public Good developed under **Digital for Climate (D4C)** — a collaboration between UNDP, EBRD, UNFCCC, IETA, ESA, and the World Bank Group.
