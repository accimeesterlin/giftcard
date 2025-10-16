# Quick Start Guide

Get up and running with the Gift Card Marketplace API in minutes.

## Prerequisites

- A Gift Card Marketplace account
- Basic knowledge of REST APIs
- A tool to make HTTP requests (cURL, Postman, or code)

## Step 1: Create an API Key

1. Log into your [dashboard](https://giftcardmarketplace.com/dashboard)
2. Navigate to **Settings → API Keys**
3. Click **"Create API Key"**
4. Configure your key:
   ```
   Name: My First API Key
   Environment: Test
   Scopes: orders:read, orders:write
   Rate Limit: 60 requests/minute
   ```
5. Click **"Create API Key"**
6. **IMPORTANT**: Copy and save your API key now - it will only be shown once!

Your test API key will look like:
```
gck_test_abc123def456ghi789jkl012mno345pqr
```

## Step 2: Get Your Company ID

You'll need your company ID for API requests. Find it in the dashboard URL:

```
https://giftcardmarketplace.com/dashboard/my-company
                                              ^^^^^^^^^^
                                              This is your company slug

```

Or make an API request to list your companies:

```bash
curl https://api.giftcardmarketplace.com/api/v1/companies \
  -H "Cookie: your-session-cookie"
```

Response:
```json
{
  "data": [
    {
      "id": "comp_abc123",
      "slug": "my-company",
      "displayName": "My Company"
    }
  ]
}
```

## Step 3: Make Your First API Request

Let's fetch your orders using the API:

```bash
curl "https://api.giftcardmarketplace.com/api/public/v1/orders?companyId=comp_abc123" \
  -H "Authorization: Bearer gck_test_abc123def456ghi789jkl012mno345pqr" \
  -H "Content-Type: application/json"
```

Success! You should receive a response like:

```json
{
  "data": [
    {
      "id": "order_xyz789",
      "companyId": "comp_abc123",
      "status": "fulfilled",
      "totalAmount": 100.00,
      "currency": "USD",
      ...
    }
  ],
  "meta": {
    "limit": 20,
    "offset": 0
  }
}
```

### Check Rate Limit Headers

Look for these headers in the response:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 2025-01-15T10:31:00Z
```

## Step 4: Filter and Paginate Results

### Filter by Status

```bash
curl "https://api.giftcardmarketplace.com/api/public/v1/orders?companyId=comp_abc123&status=fulfilled" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Paginate Results

```bash
curl "https://api.giftcardmarketplace.com/api/public/v1/orders?companyId=comp_abc123&limit=10&offset=0" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Step 5: Handle Errors

### Common Errors

#### 401 Unauthorized
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid API key",
    "statusCode": 401
  }
}
```

**Fix**: Check that your API key is correct and not revoked.

#### 403 Forbidden
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "This API key does not have the required scope: orders:read",
    "statusCode": 403
  }
}
```

**Fix**: Add the required scope to your API key.

#### 429 Rate Limited
```json
{
  "error": {
    "code": "TOO_MANY_REQUESTS",
    "message": "Rate limit exceeded. Limit: 60 requests per minute. Try again in 45 seconds.",
    "statusCode": 429
  }
}
```

**Fix**: Wait for the rate limit to reset (check `X-RateLimit-Reset` header).

## Step 6: Set Up Webhooks (Optional)

Instead of polling for changes, let us notify you when events occur.

### Create a Webhook Endpoint

First, create an endpoint that accepts POST requests:

```javascript
// Example using Express.js
app.post('/webhooks', express.json(), (req, res) => {
  const event = req.body;

  console.log('Received event:', event.event);
  console.log('Event data:', event.data);

  // Process event...

  res.status(200).send('OK');
});
```

### Configure the Webhook

1. Navigate to **Settings → Webhooks**
2. Click **"Create Webhook"**
3. Enter your endpoint URL: `https://yourapp.com/webhooks`
4. Select events: `order.paid`, `order.fulfilled`
5. Save your webhook secret

### Verify Signatures

Always verify webhook signatures:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return signature === `sha256=${expectedSignature}`;
}

app.post('/webhooks', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const secret = process.env.WEBHOOK_SECRET;

  if (!verifyWebhook(req.body, signature, secret)) {
    return res.status(401).send('Invalid signature');
  }

  const event = JSON.parse(req.body);
  // Process event...

  res.status(200).send('OK');
});
```

## Code Examples

### JavaScript / Node.js

```javascript
const fetch = require('node-fetch');

const API_KEY = 'gck_test_abc123...';
const COMPANY_ID = 'comp_abc123';
const BASE_URL = 'https://api.giftcardmarketplace.com/api/public/v1';

async function getOrders(status = null) {
  const params = new URLSearchParams({ companyId: COMPANY_ID });
  if (status) params.append('status', status);

  const response = await fetch(`${BASE_URL}/orders?${params}`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }

  return response.json();
}

// Usage
getOrders('fulfilled')
  .then(data => console.log('Orders:', data.data))
  .catch(err => console.error('Error:', err.message));
```

### Python

```python
import requests
import os

API_KEY = os.environ['GCM_API_KEY']
COMPANY_ID = 'comp_abc123'
BASE_URL = 'https://api.giftcardmarketplace.com/api/public/v1'

def get_orders(status=None):
    params = {'companyId': COMPANY_ID}
    if status:
        params['status'] = status

    response = requests.get(
        f'{BASE_URL}/orders',
        params=params,
        headers={
            'Authorization': f'Bearer {API_KEY}',
            'Content-Type': 'application/json'
        }
    )

    response.raise_for_status()
    return response.json()

# Usage
try:
    data = get_orders('fulfilled')
    print('Orders:', data['data'])
except requests.exceptions.HTTPError as err:
    print('Error:', err.response.json()['error']['message'])
```

### PHP

```php
<?php

$apiKey = getenv('GCM_API_KEY');
$companyId = 'comp_abc123';
$baseUrl = 'https://api.giftcardmarketplace.com/api/public/v1';

function getOrders($apiKey, $companyId, $status = null) {
    global $baseUrl;

    $params = ['companyId' => $companyId];
    if ($status) {
        $params['status'] = $status;
    }

    $url = $baseUrl . '/orders?' . http_build_query($params);

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json'
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        $error = json_decode($response, true);
        throw new Exception($error['error']['message']);
    }

    return json_decode($response, true);
}

// Usage
try {
    $data = getOrders($apiKey, $companyId, 'fulfilled');
    print_r($data['data']);
} catch (Exception $e) {
    echo 'Error: ' . $e->getMessage();
}
```

## Best Practices

### 1. Store API Keys Securely

```javascript
// ✅ Good - Use environment variables
const API_KEY = process.env.GCM_API_KEY;

// ❌ Bad - Hardcoded key
const API_KEY = 'gck_test_abc123...';
```

### 2. Handle Rate Limits

```javascript
async function makeApiRequest(url, options) {
  const response = await fetch(url, options);

  const remaining = parseInt(response.headers.get('X-RateLimit-Remaining'));

  if (remaining < 10) {
    console.warn(`Rate limit warning: ${remaining} requests remaining`);
  }

  if (response.status === 429) {
    const reset = new Date(response.headers.get('X-RateLimit-Reset'));
    const waitTime = reset.getTime() - Date.now();

    console.log(`Rate limited. Waiting ${waitTime}ms...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));

    return makeApiRequest(url, options);
  }

  return response.json();
}
```

### 3. Use Webhooks Instead of Polling

```javascript
// ❌ Bad - Polling every minute
setInterval(async () => {
  const orders = await getOrders();
  // Check for new orders...
}, 60000);

// ✅ Good - Use webhooks
app.post('/webhooks', (req, res) => {
  if (req.body.event === 'order.created') {
    // Process new order immediately
  }
  res.status(200).send('OK');
});
```

### 4. Implement Exponential Backoff

```javascript
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);

      if (response.ok) {
        return response.json();
      }

      // Don't retry client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        throw new Error(await response.text());
      }

      // Exponential backoff for server errors (5xx)
      if (i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }
}
```

## Next Steps

Now that you're up and running:

1. **[Read the Authentication Guide](./AUTHENTICATION.md)** - Learn about scopes, rate limits, and security
2. **[Explore the API Reference](./openapi.json)** - Full documentation of all endpoints
3. **[Set up Webhooks](./WEBHOOKS.md)** - Receive real-time notifications
4. **Create a Live API Key** - When ready for production, create a `gck_live_*` key

## Getting Help

- **Documentation**: [API Docs](https://giftcardmarketplace.com/docs)
- **Support**: api-support@giftcardmarketplace.com
- **Status**: [status.giftcardmarketplace.com](https://status.giftcardmarketplace.com)

## Common Use Cases

### Monitor New Orders

```javascript
// Using webhooks
app.post('/webhooks', (req, res) => {
  if (req.body.event === 'order.created') {
    const order = req.body.data;
    console.log(`New order: ${order.id} - $${order.totalAmount}`);

    // Send notification, update database, etc.
  }
  res.status(200).send('OK');
});
```

### Check Inventory Levels

```javascript
async function checkInventory() {
  const response = await fetch(
    `${BASE_URL}/inventory?companyId=${COMPANY_ID}`,
    {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    }
  );

  const inventory = await response.json();

  inventory.data.forEach(item => {
    if (item.quantity < 10) {
      console.warn(`Low stock: ${item.productName} (${item.quantity} remaining)`);
    }
  });
}
```

### Process Refunds

```javascript
async function refundOrder(orderId, amount) {
  const response = await fetch(
    `${BASE_URL}/orders/${orderId}/refund`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ amount })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }

  return response.json();
}
```

---

Happy coding! 🚀
