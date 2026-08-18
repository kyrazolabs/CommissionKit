import "dotenv/config";

import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import {
  commissionCalcQueue,
  exchangeRateQueue,
  logsFlushQueue,
  mailHighQueue,
  mailLowQueue,
  mailMediumQueue,
  mailSendQueue,
  syncDealsQueue,
  syncEgressQueue,
  syncRepsQueue,
  webhookIngressQueue,
} from "@workspace/queue";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

function findBullBoardUi(): string {
  let dir = path.dirname(fileURLToPath(import.meta.url));
  while (dir !== "/") {
    const candidate = path.join(dir, "node_modules", "@bull-board", "ui");
    if (fs.existsSync(path.join(candidate, "dist", "index.ejs"))) return candidate;
    dir = path.dirname(dir);
  }
  return "";
}

const bullBoardUiPath = findBullBoardUi();
if (!bullBoardUiPath) {
  console.warn("[BullBoard] Could not find @bull-board/ui package");
}

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/");

createBullBoard({
  queues: [
    new BullMQAdapter(mailHighQueue, { readOnlyMode: false }),
    new BullMQAdapter(mailMediumQueue, { readOnlyMode: false }),
    new BullMQAdapter(mailLowQueue, { readOnlyMode: false }),
    new BullMQAdapter(mailSendQueue, { readOnlyMode: false }),
    new BullMQAdapter(commissionCalcQueue, { readOnlyMode: false }),
    new BullMQAdapter(exchangeRateQueue, { readOnlyMode: false }),
    new BullMQAdapter(logsFlushQueue, { readOnlyMode: false }),
    new BullMQAdapter(syncRepsQueue, { readOnlyMode: false }),
    new BullMQAdapter(syncDealsQueue, { readOnlyMode: false }),
    new BullMQAdapter(webhookIngressQueue, { readOnlyMode: false }),
    new BullMQAdapter(syncEgressQueue, { readOnlyMode: false }),
  ],
  serverAdapter,
  options: {
    uiBasePath: bullBoardUiPath,
  },
});

const app = express();
app.use("/", serverAdapter.getRouter());

const PORT = parseInt(process.env.PORT || "3030", 10);

app.listen(PORT, () => {
  console.log(`Bull Board running at http://localhost:${PORT}`);
});
