# Webhooks Documentation

## Overview

Webhooks allow you to receive real-time notifications when events occur in your Gift Card Marketplace account. Instead of polling the API, our servers will send HTTP POST requests to your specified URL when events happen.

## How Webhooks Work

1. **Configure an endpoint**: Specify a URL where you want to receive notifications
2. **Select events**: Choose which events you want to be notified about
3. **Receive notifications**: We'll send HTTP POST requests to your URL when events occur
4. **Verify signatures**: Validate that requests came from us using HMAC signatures
5. **Respond quickly**: Return a 2xx status code within 10 seconds

## Setting Up Webhooks

### 1. Create a Webhook Endpoint

Navigate to **Settings → Webhooks** and click **"Create Webhook"**.

Configure:
- **URL**: Your endpoint URL (must be HTTPS in production)
- **Events**: Select which events to receive
- **Description**: Optional description for your reference

### 2. Save Your Secret

When you create a webhook, we generate a signing secret. **Save this secret securely** - you'll use it to verify webhook signatures.

### 3. Implement Your Endpoint

Your endpoint should:
- Accept HTTP POST requests
- Verify the webhook signature
- Process the event
- Return a 2xx status code quickly

## Webhook Events

### Order Events

| Event | Description | When it fires |
|-------|-------------|---------------|
| `order.created` | New order created | When a customer places an order |
| `order.paid` | Payment successful | When payment is confirmed |
| `order.fulfilled` | Order fulfilled | When gift cards are delivered |
| `order.failed` | Order failed | When order processing fails |
| `order.refunded` | Order refunded | When a refund is processed |

### Inventory Events

| Event | Description | When it fires |
|-------|-------------|---------------|
| `inventory.low` | Low inventory alert | When stock falls below threshold |
| `inventory.out` | Out of stock | When inventory reaches zero |

## Webhook Payload

### Payload Structure

```json
{
  "event": "order.paid",
  "data": {
    "id": "order_abc123",
    "companyId": "comp_abc123",
    "status": "paid",
    "totalAmount": 100.00,
    "currency": "USD",
    ...
  },
  "timestamp": "2025-01-15T10:30:00Z",
  "webhookId": "webhook_xyz789"
}
```

### Example Payloads

#### order.paid

```json
{
  "event": "order.paid",
  "data": {
    "id": "order_abc123",
    "companyId": "comp_abc123",
    "listingId": "listing_abc123",
    "buyerEmail": "buyer@example.com",
    "quantity": 2,
    "unitPrice": 50.00,
    "totalAmount": 100.00,
    "currency": "USD",
    "status": "paid",
    "paymentMethod": "stripe",
    "paymentIntentId": "pi_stripe_123",
    "createdAt": "2025-01-15T10:28:00Z",
    "paidAt": "2025-01-15T10:30:00Z"
  },
  "timestamp": "2025-01-15T10:30:00Z",
  "webhookId": "webhook_xyz789"
}
```

#### order.fulfilled

```json
{
  "event": "order.fulfilled",
  "data": {
    "id": "order_abc123",
    "companyId": "comp_abc123",
    "status": "fulfilled",
    "giftCards": [
      {
        "code": "XXXX-XXXX-XXXX-XXXX",
        "pin": "1234",
        "value": 50.00
      },
      {
        "code": "YYYY-YYYY-YYYY-YYYY",
        "pin": "5678",
        "value": 50.00
      }
    ],
    "fulfilledAt": "2025-01-15T10:32:00Z"
  },
  "timestamp": "2025-01-15T10:32:00Z",
  "webhookId": "webhook_xyz789"
}
```

#### inventory.low

```json
{
  "event": "inventory.low",
  "data": {
    "companyId": "comp_abc123",
    "productId": "prod_abc123",
    "productName": "Amazon $50 Gift Card",
    "currentStock": 5,
    "threshold": 10,
    "timestamp": "2025-01-15T10:35:00Z"
  },
  "timestamp": "2025-01-15T10:35:00Z",
  "webhookId": "webhook_xyz789"
}
```

## Verifying Webhook Signatures

**IMPORTANT**: Always verify webhook signatures to ensure requests came from us and haven't been tampered with.

### Signature Header

Each webhook includes an `X-Webhook-Signature` header:

```
X-Webhook-Signature: sha256=a1b2c3d4e5f6...
```

### Verification Algorithm

We use HMAC-SHA256 to sign the webhook payload:

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  // Compute expected signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  // Timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(`sha256=${expectedSignature}`)
  );
}
```

### Implementation Examples

#### Node.js / Express

```javascript
const express = require('express');
const crypto = require('crypto');

const app = express();

// Use raw body for signature verification
app.post('/webhooks',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    const signature = req.headers['x-webhook-signature'];
    const secret = process.env.WEBHOOK_SECRET;

    // Verify signature
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(req.body)
      .digest('hex');

    if (signature !== `sha256=${expectedSig}`) {
      return res.status(401).send('Invalid signature');
    }

    // Parse and process webhook
    const event = JSON.parse(req.body);

    switch (event.event) {
      case 'order.paid':
        handleOrderPaid(event.data);
        break;
      case 'order.fulfilled':
        handleOrderFulfilled(event.data);
        break;
      // ... handle other events
    }

    res.status(200).send('OK');
  }
);
```

#### Python / Flask

```python
import hmac
import hashlib
import json
from flask import Flask, request

app = Flask(__name__)

@app.route('/webhooks', methods=['POST'])
def webhook():
    signature = request.headers.get('X-Webhook-Signature')
    secret = os.environ['WEBHOOK_SECRET']

    # Compute expected signature
    expected_sig = hmac.new(
        secret.encode(),
        request.data,
        hashlib.sha256
    ).hexdigest()

    # Verify signature
    if signature != f'sha256={expected_sig}':
        return 'Invalid signature', 401

    # Process webhook
    event = request.json

    if event['event'] == 'order.paid':
        handle_order_paid(event['data'])
    elif event['event'] == 'order.fulfilled':
        handle_order_fulfilled(event['data'])

    return 'OK', 200
```

## Webhook Delivery

### Retry Logic

If your endpoint fails, we'll retry delivery:
- **Attempt 1**: Immediate
- **Attempt 2**: 2 seconds later
- **Attempt 3**: 4 seconds later

After 3 failed attempts, the webhook delivery is marked as failed.

### Timeout

Your endpoint must respond within **10 seconds**, or the request will timeout.

### Success Criteria

We consider delivery successful if:
- Your endpoint returns a 2xx status code
- Response is received within 10 seconds

### Automatic Disable

If a webhook fails **5 consecutive times**, it will be automatically disabled. You'll need to re-enable it in the dashboard after fixing the issue.

## Best Practices

### 1. Respond Quickly

Process webhooks asynchronously:

```javascript
app.post('/webhooks', async (req, res) => {
  // Verify signature
  if (!verifySignature(req)) {
    return res.status(401).send('Invalid signature');
  }

  // Immediately respond
  res.status(200).send('OK');

  // Process asynchronously
  processWebhookAsync(req.body);
});
```

### 2. Handle Duplicates

The same event might be delivered multiple times. Use the event ID or order ID to deduplicate:

```javascript
const processedEvents = new Set();

function handleWebhook(event) {
  const eventKey = `${event.event}-${event.data.id}`;

  if (processedEvents.has(eventKey)) {
    console.log('Duplicate event, skipping');
    return;
  }

  processedEvents.add(eventKey);
  // Process event...
}
```

### 3. Use HTTPS

In production, your webhook URL must use HTTPS. HTTP endpoints are only allowed for local development.

### 4. Monitor Failures

Regularly check webhook delivery status in your dashboard. Investigate failures and fix issues promptly.

### 5. Test with Test Events

Use the **"Send Test Event"** button in the dashboard to verify your endpoint works correctly.

## Testing Webhooks

### Local Development

Use tools like [ngrok](https://ngrok.com/) to expose your local server:

```bash
ngrok http 3000
```

Then use the ngrok URL in your webhook configuration:
```
https://abc123.ngrok.io/webhooks
```

### Send Test Event

In the dashboard, click the **"Send Test"** button next to any webhook to send a test payload:

```json
{
  "test": true,
  "message": "This is a test webhook event",
  "orderId": "order_test_123",
  "total": 100,
  "currency": "USD",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Debugging Failed Deliveries

Check the webhook delivery logs in your dashboard:
- View request/response details
- See error messages
- Check delivery timestamps
- Review retry attempts

## Webhook Headers

Each webhook request includes these headers:

```
Content-Type: application/json
X-Webhook-Signature: sha256=a1b2c3d4...
X-Webhook-Event: order.paid
X-Webhook-ID: webhook_xyz789
X-Webhook-Timestamp: 2025-01-15T10:30:00Z
```

## Security Considerations

### 1. Always Verify Signatures

Never process webhooks without verifying the signature. This prevents:
- Spoofed requests from attackers
- Replay attacks
- Man-in-the-middle tampering

### 2. Keep Secrets Safe

Store webhook secrets securely:
- Use environment variables
- Never commit to version control
- Rotate periodically

### 3. Validate Payload Data

Even after verifying signatures, validate the payload:
- Check data types
- Verify IDs exist in your system
- Sanitize inputs

### 4. Rate Limiting

Implement rate limiting on your webhook endpoint to prevent abuse.

## Troubleshooting

### Webhook Not Receiving Events

1. **Check webhook is enabled**: Ensure status is "Active"
2. **Verify URL is correct**: Test your endpoint manually
3. **Check firewall**: Ensure our IPs aren't blocked
4. **Review logs**: Check delivery history in dashboard

### Signature Verification Failing

1. **Check secret**: Ensure you're using the correct secret
2. **Raw body**: Use raw request body, not parsed JSON
3. **Character encoding**: Use UTF-8 encoding
4. **Timing**: Use timing-safe comparison

### Timeouts

1. **Respond immediately**: Return 200 before processing
2. **Process async**: Use background jobs
3. **Optimize**: Ensure endpoint is performant

## Webhook Limits

- **Maximum endpoints**: 10 per company
- **Timeout**: 10 seconds
- **Retry attempts**: 3
- **Max failures**: 5 before auto-disable

## Support

Need help with webhooks?

1. Test using the "Send Test Event" button
2. Review delivery logs in the dashboard
3. Check our example implementations
4. Contact support with webhook ID and timestamp

---

**Related Documentation:**
- [Authentication Guide](./AUTHENTICATION.md)
- [API Reference](./openapi.json)
- [Quick Start Guide](./QUICKSTART.md)
