const express = require("express");
const app = express();
app.use("/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
app.post("/webhook", (req, res) => {
  res.json({ isBuffer: Buffer.isBuffer(req.body), typeof: typeof req.body });
});
app.listen(9000, () => console.log("running"));
