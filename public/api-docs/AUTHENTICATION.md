# Authentication Guide

## Overview

The Gift Card Marketplace API uses API key authentication with Bearer tokens. All API requests must include a valid API key in the Authorization header.

## API Key Format

API keys follow this format:
- **Test keys**: `gck_test_[32-character-random-string]`
- **Live keys**: `gck_live_[32-character-random-string]`

Example:
```
gck_test_abc123def456ghi789jkl012mno345
gck_live_xyz789uvw456rst123opq098nml765
```

## Creating an API Key

1. Navigate to your dashboard: **Settings → API Keys**
2. Click **"Create API Key"**
3. Configure your key:
   - **Name**: A descriptive name for the key
   - **Environment**: Choose `test` or `live`
   - **Scopes**: Select the permissions your key needs
   - **Rate Limit**: Set requests per minute (default: 60)
4. **Save the key immediately** - it will only be shown once!

## Making Authenticated Requests

### Authorization Header

Include your API key in the `Authorization` header using the `Bearer` scheme:

```bash
curl https://api.giftcardmarketplace.com/api/public/v1/orders?companyId=comp_abc123 \
  -H "Authorization: Bearer gck_live_YOUR_API_KEY_HERE" \
  -H "Content-Type: application/json"
```

### JavaScript Example

```javascript
const apiKey = 'gck_test_abc123...';
const companyId = 'comp_abc123';

const response = await fetch(
  `https://api.giftcardmarketplace.com/api/public/v1/orders?companyId=${companyId}`,
  {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  }
);

const data = await response.json();
console.log(data);
```

### Python Example

```python
import requests

api_key = 'gck_test_abc123...'
company_id = 'comp_abc123'

headers = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json'
}

response = requests.get(
    f'https://api.giftcardmarketplace.com/api/public/v1/orders',
    params={'companyId': company_id},
    headers=headers
)

data = response.json()
print(data)
```

## Scopes and Permissions

API keys use scope-based permissions to control access. You must request the minimum scopes needed for your integration.

### Available Scopes

| Scope | Description |
|-------|-------------|
| `orders:read` | Read order data |
| `orders:write` | Create new orders |
| `orders:fulfill` | Mark orders as fulfilled |
| `orders:refund` | Process refunds |
| `inventory:read` | View inventory levels |
| `inventory:write` | Add inventory |
| `listings:read` | View product listings |
| `listings:write` | Create and update listings |
| `webhooks:read` | View webhook configurations |
| `webhooks:write` | Create and manage webhooks |
| `*` | Full API access (use with extreme caution) |

### Scope Validation

If your API key lacks the required scope, you'll receive a `403 Forbidden` error:

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "This API key does not have the required scope: orders:write",
    "statusCode": 403,
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

## Rate Limiting

### How It Works

Each API key has a configurable rate limit (requests per minute). The API uses a sliding window algorithm to track requests.

### Rate Limit Headers

Every API response includes rate limit information:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 58
X-RateLimit-Reset: 2025-01-15T10:31:00Z
```

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests per minute for your key |
| `X-RateLimit-Remaining` | Requests remaining in current window |
| `X-RateLimit-Reset` | ISO timestamp when the limit resets |

### Rate Limit Exceeded

When you exceed your rate limit, you'll receive a `429 Too Many Requests` error:

```json
{
  "error": {
    "code": "TOO_MANY_REQUESTS",
    "message": "Rate limit exceeded. Limit: 60 requests per minute. Try again in 45 seconds.",
    "statusCode": 429,
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

### Best Practices

1. **Monitor the headers**: Check `X-RateLimit-Remaining` to avoid hitting limits
2. **Implement exponential backoff**: When rate limited, wait before retrying
3. **Batch requests**: Combine multiple operations when possible
4. **Cache responses**: Don't request the same data repeatedly
5. **Use webhooks**: Let us notify you instead of polling

### Example: Handling Rate Limits

```javascript
async function makeApiRequest(url, options) {
  const response = await fetch(url, options);

  // Check rate limit headers
  const remaining = parseInt(response.headers.get('X-RateLimit-Remaining'));
  const reset = response.headers.get('X-RateLimit-Reset');

  if (response.status === 429) {
    // Rate limited - wait and retry
    const resetTime = new Date(reset);
    const waitTime = resetTime.getTime() - Date.now();

    console.log(`Rate limited. Waiting ${waitTime}ms...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));

    // Retry the request
    return makeApiRequest(url, options);
  }

  // Warn if approaching limit
  if (remaining < 10) {
    console.warn(`Rate limit warning: ${remaining} requests remaining`);
  }

  return response.json();
}
```

## Security Best Practices

### 1. Keep API Keys Secret

- **Never commit** API keys to version control
- **Never expose** keys in client-side code
- **Use environment variables** to store keys
- **Rotate keys** regularly

### 2. Use Test Keys for Development

Always use `gck_test_*` keys during development. Only use `gck_live_*` keys in production.

### 3. Minimum Scope Principle

Request only the scopes your integration needs. Avoid using the wildcard `*` scope unless absolutely necessary.

### 4. Revoke Compromised Keys

If a key is compromised:
1. Immediately revoke it in the dashboard
2. Create a new key with different credentials
3. Update your application to use the new key

### 5. Monitor API Key Usage

Regularly review:
- Last used timestamps
- Request patterns
- Error rates

## Error Handling

### Common Authentication Errors

#### 401 Unauthorized - Missing or Invalid Key

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid API key",
    "statusCode": 401
  }
}
```

**Causes:**
- No Authorization header provided
- Invalid API key format
- API key doesn't exist
- API key has been revoked

#### 403 Forbidden - Insufficient Permissions

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "This API key does not have the required scope: orders:write",
    "statusCode": 403
  }
}
```

**Causes:**
- API key lacks required scope
- API key doesn't have access to the requested company

### Testing Authentication

```bash
# Test your API key
curl https://api.giftcardmarketplace.com/api/public/v1/orders?companyId=YOUR_COMPANY_ID \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -v

# Check the response:
# - 200 OK: Authentication successful
# - 401: Invalid or missing key
# - 403: Insufficient permissions
# - 429: Rate limit exceeded
```

## Environments

### Test Environment

- **Base URL**: `http://localhost:3000/api/public/v1` (development)
- **API Keys**: `gck_test_*`
- **Use for**: Development, testing, integration testing
- **Data**: Uses test data, no real transactions

### Live Environment

- **Base URL**: `https://api.giftcardmarketplace.com/api/public/v1`
- **API Keys**: `gck_live_*`
- **Use for**: Production applications
- **Data**: Real transactions, real gift cards

## Support

If you encounter authentication issues:

1. Check that your API key is valid and not revoked
2. Verify you're using the correct Authorization header format
3. Ensure your key has the required scopes
4. Check rate limit headers
5. Contact support with your API key ID (not the full key!)

---

**Next Steps:**
- [Quick Start Guide](./QUICKSTART.md)
- [API Reference](./openapi.json)
- [Webhook Documentation](./WEBHOOKS.md)
