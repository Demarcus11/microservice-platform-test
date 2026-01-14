import express from "express";

const server = express(); // Create HTTP Server
server.use(express.json());

const inventory = [
  { id: "1", name: "MacBook Pro", stock: 10, price: 1200 },
  { id: "2", name: "iPhone 15", stock: 0, price: 900 },
  { id: "3", name: "Magic Mouse", stock: 25, price: 50 },
];

// 1. GET /items - List everything
server.get("/items", (req, res) => {
  res.json(inventory);
});

// 2. GET /items/:id - Check stock for a specific item
// This is the endpoint your Order Service will call
server.get("/items/:id", (req, res) => {
  const itemId = req.params.id; // This is "1" from the URL

  // Search the array for the object with id: "1"
  const item = inventory.find((i) => i.id === itemId);

  if (!item) {
    return res.status(404).json({ error: "Item not found" });
  }

  res.json(item);
});

// 3. POST /items/:id/restock - Update stock
// Great for the demo: Restock the 'phone' and then try the order again!
server.post("/items/:id/restock", (req, res) => {
  const itemId = req.params.id;
  const { amount } = req.body;

  // Search for the item to update it
  const item = inventory.find((i) => i.id === itemId);

  if (!item) {
    return res.status(404).json({ error: "Item not found" });
  }

  item.stock += amount;
  res.json({ message: "Stock updated", currentStock: item.stock });
});

// 4. GET /health - For Kubernetes Liveness/Readiness probes
server.get("/health", (req, res) => {
  res.status(200).send("Inventory Service is Healthy");
});

server.listen(5000, () => console.log(`Server is running on PORT 5000...`));
