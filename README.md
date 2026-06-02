# Manufacturing West Demo Portal

A self-service portal for sales reps to browse, review, and launch demos running on a Snowflake account. Built with Next.js and deployed on Snowpark Container Services (SPCS).

## What This Demo Shows

This portal demonstrates how Snowflake's platform capabilities can be showcased through a unified demo launcher:

1. **Browse Demos** — Filterable tiles by manufacturing topic and Snowflake capability
2. **Launch Demos** — One-click launch of SPCS apps, Streamlit apps, and other demos
3. **Admin Management** — No-SQL wizard to add, edit, and manage demo entries
4. **Dynamic Configuration** — Customizable topics and capabilities via admin settings

## Architecture

```
SPCS Container (port 8080)
+------------------------------------------+
|  Next.js Frontend + API Routes (port 3000)|
|    -> Snowflake SDK (Key-Pair JWT Auth)   |
|    -> Image proxy (/api/image)            |
|    -> File upload to stages               |
|                                           |
|  Nginx (port 8080) -> reverse proxy      |
+------------------------------------------+
         |
         v
  PORTAL_PRIVATE_KEY_SECRET (mounted as env var)
         |
         v
  Snowflake SDK (SNOWFLAKE_JWT authenticator)
         |
         v
  DEMO_PORTAL database (DEMOS, SETTINGS tables)
  IMAGES_STAGE / SCRIPTS_STAGE
```

### Snowflake Objects Created

| Object | Type | Purpose |
|--------|------|---------|
| DEMO_PORTAL | Database | All portal data |
| DEMOS | Table | Demo registry (name, URL, topics, thumbnail) |
| SETTINGS | Table | Dynamic topics/capabilities config |
| IMAGES_STAGE | Stage | Demo screenshot storage |
| SCRIPTS_STAGE | Stage | Click-script file storage |
| PORTAL_PRIVATE_KEY_SECRET | Secret | RSA private key for service auth |
| PORTAL_REPO | Image Repository | Docker image storage |
| DEMO_PORTAL_SVC | Service | The running portal app |
| DEMO_PORTAL_POOL | Compute Pool | CPU_X64_XS node |
| DEMO_PORTAL_ROLE | Role | Least-privilege access |
| DEMO_PORTAL_SVC | User (SERVICE) | Dedicated service account |
| DEMO_PORTAL_EXTERNAL_ACCESS | EAI | Network egress for Snowflake API + S3 |

## Prerequisites

- Snowflake account on AWS (SPCS requires AWS)
- ACCOUNTADMIN role (or equivalent privileges)
- Docker Desktop (for building the container image)
- Snowflake CLI (`pip install snowflake-cli`)
- Python 3.11+ (for JSON parsing in setup script)
- openssl (for RSA key generation)

## CLI Connection Setup

The setup script uses the Snowflake CLI (`snow`) with key-pair JWT authentication.

### 1. Generate an RSA Key Pair (if you don't have one)

```bash
mkdir -p ~/.snowflake/keys
openssl genrsa 2048 | openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt > ~/.snowflake/keys/<connection_name>.p8
chmod 600 ~/.snowflake/keys/<connection_name>.p8
```

Assign the public key to your Snowflake user:

```bash
openssl rsa -in ~/.snowflake/keys/<connection_name>.p8 -pubout -out /tmp/key.pub
PUBLIC_KEY=$(grep -v 'BEGIN\|END' /tmp/key.pub | tr -d '\n')
```

```sql
ALTER USER <username> SET RSA_PUBLIC_KEY='<PUBLIC_KEY>';
```

### 2. Configure `~/.snowflake/connections.toml`

```toml
[<connection_name>]
account = "<ORG>-<ACCOUNT>"
user = "<USERNAME>"
authenticator = "SNOWFLAKE_JWT"
private_key_file = "~/.snowflake/keys/<connection_name>.p8"
role = "ACCOUNTADMIN"
```

### 3. Configure `~/.snowflake/config.toml`

```toml
default_connection_name = "<connection_name>"
```

### 4. Verify

```bash
snow sql --connection <connection_name> -q "SELECT CURRENT_USER()"
```

## Quick Start

```bash
git clone https://github.com/azbarbarian2020/demo-portal.git
cd demo-portal
./setup.sh
```

Estimated time: 5-10 minutes (mostly Docker build + SPCS startup)

The setup script will:

1. Prompt for your Snowflake CLI connection name
2. Auto-detect account, host, and registry
3. Prompt for database, schema, warehouse, and compute pool names
4. Create all infrastructure (database, schema, warehouse, compute pool, image repo, stages)
5. Create service user (DEMO_PORTAL_SVC) with least-privilege role
6. Generate RSA key-pair and create Snowflake secret
7. Create network rules and external access integration
8. Build and push the Docker image (linux/amd64)
9. Deploy the SPCS service
10. Print the application URL

## Using the Portal

### Adding Demos (Admin)

1. Navigate to the portal URL and log in
2. Click **Admin** in the top-right corner
3. Click **Add Demo** to launch the 5-step wizard:
   - **Basic Info**: Name, description, entry URL
   - **Links**: Video URL (optional)
   - **Categories**: Select topics and capabilities
   - **Files**: Upload screenshot and click-script (optional)
   - **Review**: Confirm and publish

### Managing Settings

- Go to **Admin > Settings** to add/remove topics and capabilities
- Changes apply immediately to the filter bar

### Launching Demos

- Click **Launch** on any demo tile to open it in a new tab
- Note: Each SPCS demo has its own endpoint and requires Snowflake authentication

## Local Development

```bash
cp .env.example .env.local
# Edit .env.local with your credentials
npm install
npm run dev
# Access at http://localhost:3005
```

### Environment Variables (.env.local)

```
SNOWFLAKE_ACCOUNT=<ORG>-<ACCOUNT>
SNOWFLAKE_USER=<USERNAME>
SNOWFLAKE_WAREHOUSE=<WAREHOUSE>
SNOWFLAKE_PRIVATE_KEY_PATH=~/.snowflake/keys/<connection>.p8
SNOWFLAKE_ROLE=ACCOUNTADMIN
```

## Project Structure

```
demo-portal/
  src/
    app/                    # Next.js App Router
      page.tsx              # Landing page (demo grid)
      admin/                # Admin dashboard
        page.tsx            # Demo list
        add/page.tsx        # 5-step add wizard
        edit/[id]/page.tsx  # Edit form
        settings/page.tsx   # Topics/capabilities management
      api/                  # API routes
        health/             # Health check (readiness probe)
        demos/              # CRUD for demos
        image/              # Image proxy (presigned URL -> browser)
        upload/             # File upload to stages
        settings/           # Dynamic settings
    components/             # React components
      Header.tsx            # Dark gradient header with logo
      FilterBar.tsx         # Topic + capability filters
      DemoGrid.tsx          # Responsive card grid
      DemoTile.tsx          # Individual demo card
      DemoDetail.tsx        # Slide-over detail drawer
    lib/
      snowflake.ts          # Snowflake SDK connection (key-pair JWT)
      types.ts              # TypeScript interfaces + defaults
  scripts/                  # SQL deployment scripts
  public/                   # Static assets (logos)
  setup.sh                  # Automated deployment
  teardown.sh               # Safe cleanup
  Dockerfile                # Multi-stage build
  nginx.conf                # Reverse proxy config
  supervisord.conf          # Process manager
```

## Scripts

| Script | Purpose |
|--------|---------|
| `./setup.sh` | Full automated deployment (interactive prompts) |
| `./teardown.sh` | Safe cleanup (removes all portal objects) |

## Updating an Existing Deployment

```bash
# 1. Build new image
docker buildx build --platform linux/amd64 --no-cache -t demo-portal:v2 .

# 2. Login and push
snow spcs image-registry login --connection <conn>
REGISTRY=<org-account>.registry.snowflakecomputing.com
docker tag demo-portal:v2 $REGISTRY/<db>/<schema>/portal_repo/demo-portal:v2
docker push $REGISTRY/<db>/<schema>/portal_repo/demo-portal:v2

# 3. Update service
snow sql --connection <conn> -q "ALTER SERVICE <db>.<schema>.DEMO_PORTAL_SVC FROM SPECIFICATION \$\$
spec:
  containers:
    - name: demo-portal
      image: /<db>/<schema>/portal_repo/demo-portal:v2
      ...
\$\$"
```

## Troubleshooting

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues and fixes.

## License

MIT License
