# Troubleshooting

## Common Issues

### "Loading demos..." spinner never stops

**Cause**: The `/api/demos` endpoint is failing silently.

**Fix**:
1. Check service logs: `CALL SYSTEM$GET_SERVICE_LOGS('DEMO_PORTAL.PUBLIC.DEMO_PORTAL_SVC', '0', 'demo-portal', 100);`
2. Look for `Query error:` or `Snowflake connection error:` messages
3. Verify grants: `SHOW GRANTS TO ROLE DEMO_PORTAL_ROLE;`
4. Ensure SETTINGS table is granted: `GRANT SELECT, INSERT, UPDATE ON TABLE DEMO_PORTAL.PUBLIC.SETTINGS TO ROLE DEMO_PORTAL_ROLE;`

### Thumbnails not showing (broken images)

**Cause**: SPCS Content Security Policy blocks external image URLs. The app proxies images through `/api/image`, which needs network egress to the S3 stage host.

**Fix**:
1. Check if S3 host is in the network rule:
   ```sql
   DESC NETWORK RULE DEMO_PORTAL.PUBLIC.SNOWFLAKE_API_RULE;
   ```
2. If missing, find the S3 host:
   ```sql
   SELECT PARSE_JSON(VALUE)['host']::VARCHAR FROM TABLE(FLATTEN(INPUT => PARSE_JSON(SYSTEM$ALLOWLIST())))
   WHERE PARSE_JSON(VALUE)['type']::VARCHAR = 'STAGE' AND PARSE_JSON(VALUE)['host']::VARCHAR LIKE '%s3.%amazonaws.com' LIMIT 1;
   ```
3. Update the network rule to include it.

### `getaddrinfo ENOTFOUND sfsenorthamerica-....snowflakecomputing.com`

**Cause**: The SPCS container cannot resolve the Snowflake hostname because no External Access Integration (EAI) is configured.

**Fix**:
1. Verify EAI exists: `SHOW EXTERNAL ACCESS INTEGRATIONS LIKE 'DEMO_PORTAL%';`
2. Verify EAI is attached to service: The service must be created with `EXTERNAL_ACCESS_INTEGRATIONS = (DEMO_PORTAL_EXTERNAL_ACCESS)`
3. If missing, recreate the service with the EAI (drop and recreate, or use `ALTER SERVICE ... FROM SPECIFICATION`)

### Publish fails with "Unexpected token '<', is not valid JSON"

**Cause**: The API route is returning an HTML error page instead of JSON. Usually means an unhandled server error.

**Fix**:
1. Check service logs for the actual error
2. Common causes:
   - Missing SETTINGS table grant
   - Missing OPERATE on warehouse (can't resume suspended warehouse)
   - File upload tmp directory issues

### Each demo requires separate login

**Cause**: This is expected SPCS behavior. Each service has its own subdomain with independent OAuth cookies.

**Workaround**: Configure SSO (SAML/Okta) on the account. With SSO, the redirect is invisible because the IdP session is shared.

### Service stuck in PENDING state

**Cause**: Usually the readiness probe is failing.

**Fix**:
1. Check status: `SELECT SYSTEM$GET_SERVICE_STATUS('DEMO_PORTAL.PUBLIC.DEMO_PORTAL_SVC');`
2. Check logs: `CALL SYSTEM$GET_SERVICE_LOGS('DEMO_PORTAL.PUBLIC.DEMO_PORTAL_SVC', '0', 'demo-portal', 50);`
3. The health endpoint (`/api/health`) should return `{"status":"ok"}` without needing Snowflake connectivity

### Network policy resets every 12 hours (SE demo accounts)

**Cause**: Snowflake SE demo accounts have `ACCOUNT_LEVEL_NETWORK_POLICY_TASK` that resets the account-level network policy to hardcoded VPN IPs.

**Fix**: The setup script adds the SPCS CIDR to the account policy. If it gets reset:
```sql
-- Find current policy
SHOW PARAMETERS LIKE 'NETWORK_POLICY' IN ACCOUNT;
DESC NETWORK POLICY <policy_name>;
-- Add SPCS CIDR
ALTER NETWORK POLICY <policy_name> SET ALLOWED_IP_LIST = (<existing_ips>, '153.45.59.0/24');
```

### Docker push fails with "unauthorized"

**Cause**: Registry login token expired.

**Fix**:
```bash
snow spcs image-registry login --connection <connection_name>
# Then retry the push
```

### Connection pool creating multiple connections

**Cause**: Race condition when multiple API requests arrive simultaneously before the first connection is established.

**Fix**: This is handled in the code with a `connectingPromise` singleton. If you see excessive connection creation in logs, ensure you're running the latest image version.

## Useful Commands

```sql
-- Check service status
SELECT SYSTEM$GET_SERVICE_STATUS('DEMO_PORTAL.PUBLIC.DEMO_PORTAL_SVC');

-- View service logs
CALL SYSTEM$GET_SERVICE_LOGS('DEMO_PORTAL.PUBLIC.DEMO_PORTAL_SVC', '0', 'demo-portal', 100);

-- Get endpoint URL
SHOW ENDPOINTS IN SERVICE DEMO_PORTAL.PUBLIC.DEMO_PORTAL_SVC;

-- Restart service
ALTER SERVICE DEMO_PORTAL.PUBLIC.DEMO_PORTAL_SVC SUSPEND;
ALTER SERVICE DEMO_PORTAL.PUBLIC.DEMO_PORTAL_SVC RESUME;

-- Check grants
SHOW GRANTS TO ROLE DEMO_PORTAL_ROLE;

-- Check network rule
DESC NETWORK RULE DEMO_PORTAL.PUBLIC.SNOWFLAKE_API_RULE;
```
