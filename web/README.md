# Adlas

**Connecting transport operators and media partners through advertising interoperability.**

Adlas is building an interoperability platform for the UK transport media advertising ecosystem. It aims to help transport operators, out-of-home (OOH) media owners and their commercial partners connect fragmented information, understand available advertising inventory and identify opportunities across transport networks.

The goal is to make transport media easier to discover, compare, commercialise and measure — without requiring every organisation to rebuild the same integrations independently.

## The opportunity

Transport advertising spans operators, stations, vehicles, terminals, roadside environments, media owners, concessionaires and advertising partners. Each organisation may manage its own inventory, commercial information and operational systems.

When this information is fragmented, commercial teams can face unnecessary complexity when trying to:

- Understand what advertising inventory is available across different networks.
- Exchange consistent information between operators and media partners.
- Discover opportunities that cross organisational and network boundaries.
- Reduce repeated work connecting commercial systems and data sources.
- Bring inventory, campaign and performance information into a more coherent view.

Adlas is focused on the interoperability layer that helps these organisations work together.

## What Adlas is designed to do

### 1. Connect transport operators and media partners

Create a more consistent foundation for exchanging relevant commercial and inventory information between participating organisations.

The objective is to make partner relationships and data connections reusable, rather than treating every connection as an isolated project.

### 2. Make advertising inventory easier to understand

Help commercial teams organise and discover transport media inventory using consistent, structured information.

The longer-term objective is to support clearer comparisons across locations, formats, operators and media estates, subject to the data available from participating partners.

### 3. Identify cross-network advertising opportunities

Help operators and media partners explore opportunities that may extend beyond a single network or inventory owner.

Better-connected information can make it easier to identify complementary inventory and potential multi-network propositions for advertisers and media planners.

### 4. Reduce duplicated integration effort

Develop reusable integration patterns and common data structures that can reduce the operational effort involved in connecting organisations and systems.

The intended benefit is less repeated integration work and a more scalable approach to partner connectivity.

### 5. Establish a foundation for performance measurement

Create a foundation for connecting relevant campaign, inventory and performance information where suitable data is available and can be exchanged appropriately.

The aim is to support more coherent commercial reporting without assuming that all operators or media partners already use compatible systems or measurement methods.

## Who Adlas serves

**Transport operators and authorities**
- Improve the discoverability and organisation of transport media inventory.
- Support collaboration with media owners and commercial partners.
- Explore opportunities spanning multiple transport networks.

**OOH media owners and concessionaires**
- Work towards more consistent inventory information.
- Reduce friction when collaborating with transport operators.
- Explore additional commercial opportunities across connected networks.

**Media planners and buying partners**
- Build a clearer understanding of transport media opportunities.
- Explore inventory across participating operators and media estates.
- Work towards more consistent information for planning and comparison.

**Commercial, data and technology teams**
- Establish reusable approaches to exchanging commercial data.
- Reduce duplicated work across integrations.
- Build a more connected foundation for reporting and future automation.

## The interoperability approach

Adlas is centred on making information useful across organisational boundaries.

The intended approach combines:

- **Structured data:** organise commercial and inventory information consistently.
- **Reusable connections:** reduce the need to solve the same integration problems repeatedly.
- **Partner interoperability:** support information exchange between operators and media partners.
- **Commercial discovery:** make relevant inventory and potential opportunities easier to understand.
- **Governed exchange:** develop appropriate controls around access, permissions and the use of shared information.
- **Measurement foundations:** support the connection of performance data where suitable sources and agreements exist.

These are product objectives. The availability of each capability depends on implementation, partner participation, data access and validation.

## Current platform capabilities

The repository currently contains the foundations for an evolving web platform, including:

| Area | Current implementation |
|---|---|
| Public website | Homepage, solutions pages, contact page and an Insights article |
| Search visibility | Shared SEO metadata, canonical URL helpers, structured-data utilities, sitemap and robots routes |
| Account access | Registration, login and Auth.js integration |
| Email verification | Verification and resend-verification flows |
| Account recovery | Password-reset request and reset flows |
| Account access control | Entitlement and billing-access logic, with associated tests |
| Contact enquiries | Contact form and API route |
| Database | PostgreSQL-oriented schema migrations |
| Backend foundation | Go API service entry point |
| Quality assurance | Automated tests covering authentication, entitlements, billing access and contact handling |

The codebase establishes application and account-management foundations. It does **not** by itself establish that live integrations with transport operators, external media inventory feeds, cross-network booking, campaign execution or unified performance measurement are already available.

## Product direction

Adlas is being developed incrementally, with a focused initial market rather than an attempt to replicate a general-purpose advertising intelligence database.

The intended progression is:

1. Establish reliable public information, account access and subscription foundations.
2. Define and validate the commercial and inventory information that transport operators and media partners need to exchange.
3. Develop and test reusable interoperability patterns.
4. Validate data availability and integration requirements with relevant partners.
5. Expand into inventory discovery, cross-network commercial opportunities and performance visibility as the underlying data and integrations become available.

The sequence will be informed by validation with the intended users and partners.

## Technology

The current repository includes:

- **Next.js, React and TypeScript** for the web application.
- **Auth.js** for authentication integration.
- **Go** for the backend service foundation.
- **PostgreSQL-oriented SQL migrations** for the data layer.
- **Automated tests** for key account, access-control and application workflows.

The project separates web routes, reusable components, authentication, billing and entitlement logic, database access and backend services.

## Repository structure

```text
.
├── database/
│   └── migrations/
├── docs/
│   └── ARCHITECTURE.md
├── services/
│   └── api/
├── web/
│   ├── src/app/
│   ├── src/components/
│   ├── src/lib/
│   └── tests/
├── .env.example
├── go.mod
└── README.md
```

## Project status

**Adlas is under active development.**

The current focus is building the application foundation and validating the specific interoperability needs of transport operators and their OOH media partners.

Descriptions of future capabilities in this README represent the product direction, not a guarantee that a capability is already live. External integrations and partner data access must be developed and verified individually.

## Security and responsible data exchange

Interoperability requires clear boundaries around who can access information and how it may be used. Adlas's development should account for authentication, access controls, partner permissions, data provenance and appropriate handling of commercially sensitive information.

Do not commit credentials, production secrets, private keys or local environment files to this repository.

## Licence

No open-source licence is currently specified. Unless a licence is added, assume that reuse and redistribution of the code are not granted by this README.
