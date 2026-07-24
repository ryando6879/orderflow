const { logger } = require("../lib/logger");
const { alertJobFailure } = require("../integrations/slackAlerts");

// The in-process job scheduler. There is no queue service yet: jobs are
// intervals inside the API process (docs/ARCHITECTURE.md#jobs). Every job
// must be idempotent, because a deploy can interrupt a run halfway and
// the next tick will start it again.

const abandonedCartSweep = require("./abandonedCartSweep");
const expireReservations = require("./expireReservations");
const dunningRun = require("./dunningRun");
const renewSubscriptions = require("./renewSubscriptions");
const reconcilePayouts = require("./reconcilePayouts");

const MINUTE = 60_000;

const JOBS = [
  { name: "expire-reservations", everyMs: 5 * MINUTE, run: expireReservations.run },
  { name: "abandoned-cart-sweep", everyMs: 15 * MINUTE, run: abandonedCartSweep.run },
  { name: "renew-subscriptions", everyMs: 60 * MINUTE, run: renewSubscriptions.run },
  { name: "dunning-run", everyMs: 6 * 60 * MINUTE, run: dunningRun.run },
  { name: "reconcile-payouts", everyMs: 24 * 60 * MINUTE, run: reconcilePayouts.run },
];

/**
 * Run one job, catching and reporting anything it throws. A failing job
 * must never take the API process with it.
 *
 * @param {{name: string, run: Function}} job
 */
async function runJob(job) {
  const startedAt = Date.now();
  try {
    const result = await job.run();
    logger.info("job finished", { job: job.name, durationMs: Date.now() - startedAt, ...result });
    return result;
  } catch (err) {
    logger.error("job failed", { job: job.name, error: err.message, stack: err.stack });
    await alertJobFailure(job.name, err);
    return { error: err.message };
  }
}

/** Start every job on its interval. Returns a handle with `stop()`. */
function startScheduler(jobs = JOBS) {
  const timers = jobs.map((job) => {
    const timer = setInterval(() => {
      runJob(job);
    }, job.everyMs);
    timer.unref();
    return timer;
  });
  logger.info("scheduler started", { jobs: jobs.map((job) => job.name) });
  return {
    stop() {
      timers.forEach(clearInterval);
      logger.info("scheduler stopped");
    },
  };
}

module.exports = { JOBS, runJob, startScheduler };
