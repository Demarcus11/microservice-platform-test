# Endpoints

- POST /orders: Create an Order
- GET /orders/:id Check Status ("Processing" or "Completed")
- GET /health Health Check
- GET /metrics Observability

# POST /orders

1. User sends POST request to /orders: { "item": "laptop", "quantity": 1 }
2. Code makes a GET request to /inventory/items/laptop
3. If /inventory responses with yes: Return 201 Created with an Order ID.
4. If Inventory says no: Return 400 Bad Request ("Out of Stock").
5. If Inventory is DOWN: Return 503 Service Unavailable (This is a great moment to show off your Grafana alert!).

When your Order Server tries to talk to the Inventory Server inside Kubernetes, you cannot use localhost. You must use the Kubernetes Service Name.

If your Inventory Service is named inventory-service, your fetch inside the Express code will look like this:

`const response = await fetch('http://inventory-service/items/laptop');`
