import "dotenv/config";

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import express from "express";
import { createBullBoard } from "@bull-board/api";
import { ExpressAdapter } from "@bull-board/express";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";

import {
  mailHighQueue,
  mailMediumQueue,
  mailLowQueue,
  mailSendQueue,
  commissionCalcQueue,
  exchangeRateQueue,
  logsFlushQueue,
  syncRepsQueue,
  syncDealsQueue,
  webhookIngressQueue,
  syncEgressQueue,
} from "@workspace/queue";

function findBullBoardUi(): string {
  let dir = path.dirname(fileURLToPath(import.meta.url));
  while (dir !== "/") {
    const candidate = path.join(dir, "node_modules", "@bull-board", "ui");
    if (fs.existsSync(path.join(candidate, "dist", "index.ejs")))
      return candidate;
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
