const { requestJson } = require("./httpClient");
const { config } = require("../config");
const { logger } = require("../lib/logger");

// Operational alerts to the #orders-alerts channel. These are for the
// team, never for customers — keep customer data out of the text.

const SEVERITY_EMOJI = { info: ":information_source:", warn: ":warning:", error: ":rotating_light:" };

/**
 * Post an alert. A missing webhook URL (local dev, CI) logs instead of
 * posting, and a failed post is never allowed to break the caller.
 *
 * @param {{severity?: "info"|"warn"|"error", title: string,
 *          fields?: Record<string, unknown>}} alert
 */
async function postAlert(alert) {
  const severity = alert.severity || "info";
  const text = `${SEVERITY_EMOJI[severity]} *${alert.title}*`;
  const fields = alert.fields || {};

  if (!config.alerts.slackWebhookUrl) {
    logger.info("alert not posted (no webhook configured)", { title: alert.title, ...fields });
    return { posted: false };
  }

  try {
    await requestJson({
      method: "POST",
      url: config.alerts.slackWebhookUrl,
      attempts: 2,
      body: {
        text,
        blocks: [
          { type: "section", text: { type: "mrkdwn", text } },
          {
            type: "section",
            fields: Object.entries(fields).map(([key, value]) => ({
              type: "mrkdwn",
              text: `*${key}*\n${value}`,
            })),
          },
        ],
      },
    });
    return { posted: true };
  } catch (err) {
    logger.error("failed to post alert", { title: alert.title, error: err.message });
    return { posted: false, error: err.message };
  }
}

/** A job failed — the on-call channel wants to know. */
async function alertJobFailure(jobName, err) {
  return postAlert({
    severity: "error",
    title: `job ${jobName} failed`,
    fields: { error: err.message },
  });
}

module.exports = { postAlert, alertJobFailure, SEVERITY_EMOJI };
