const express = require("express");
const app = express();
app.use("/api/billing/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
app.post("/api/billing/webhook", (req, res) => {
  res.json({ isBuffer: Buffer.isBuffer(req.body), typeof: typeof req.body });
});
app.listen(9001, () => console.log("running"));
