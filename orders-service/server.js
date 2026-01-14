import express from "express";
import { Registry, Counter, collectDefaultMetrics } from "prom-client";

/*
When you eventually deploy to your kind cluster, you will create a Service for your Inventory microservice. Kubernetes automatically creates a DNS entry for every Service.

If your Inventory Service is named inventory-service and it is in the default namespace, the URL inside the cluster will be: http://inventory-service:5000
In the deployment.yaml file we inject the URL:
env:
  - name: INVENTORY_URL
    value: "http://inventory-service:5000"
Your local .env doesn't get pushed to github because the .gitignore so it won't affect anything in production, Kubernetes will inject the process.env variable
*/
const INVENTORY_URL = process.env.INVENTORY_URL || "http://localhost:5000";

// 1. Initialize the Registry
const register = new Registry();

// 2. Collect System Metrics (CPU, RAM, etc.)
// This is "Production-Grade" because it gives you infra data for free
collectDefaultMetrics({ register });

// 3. Define your Business Metric
const ordersCounter = new Counter({
  name: "total_orders_processed",
  help: "Total number of orders created in the system",
  labelNames: ["status"], // Allows filtering in Grafana
});

// Register the custom metric
register.registerMetric(ordersCounter);

const orders = [
  {
    id: "1",
    itemId: "1", // foreign key for inventory
    quantity: 1,
    status: "Completed", // statuses: Processing, Completed, Failed
    createdAt: "2026-01-14T10:00:00Z",
    totalPrice: 1200.0,
  },
  {
    id: "2",
    itemId: "3",
    quantity: 2,
    status: "Processing",
    createdAt: "2026-01-14T10:30:00Z",
    totalPrice: 50.0,
  },
];

const server = express(); // Create HTTP Server
server.use(express.json());

server.get("/orders/:id", (req, res) => {
  const orderId = req.params.id;

  const order = orders.find((item) => item.id == orderId);

  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  res.json(order);
});

server.get("/health", (req, res) => {
  res.status(200).send("Orders Service Healthy");
});

// 4. The /metrics GET route
server.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

server.post("/orders", async (req, res) => {
  const { itemId, quantity } = req.body;

  // 1. Validation (Always validate input in a real enterprise app)
  if (!itemId || !quantity) {
    return res.status(400).json({ error: "Missing itemId or quantity" });
  }

  try {
    const inventoryResponse = await fetch(`${INVENTORY_URL}/items/${itemId}`);
    const inventoryData = await inventoryResponse.json();

    if (inventoryData.stock < quantity) {
      return res.status(400).json({
        error: "Insufficient stock",
        available: inventoryData.stock,
      });
    }

    const newOrder = {
      id: `${orders.length + 1}`,
      itemId,
      quantity,
      status: "Completed",
      createdAt: new Date().toISOString(),
    };

    orders.push(newOrder);

    ordersCounter.inc({ status: "success" });
    res.status(201).json({ message: "Order Created" });
  } catch (error) {
    // If failed (e.g., Inventory service is down):
    ordersCounter.inc({ status: "failure" });
    res.status(503).json({ error: "Service Unavailable" });
  }
});

// Start server
server.listen(8000, () => console.log(`Server is running on PORT 8000...`));
