// PostgreSQL-backed job queue with exponential backoff and dead-letter support.
// Uses Prisma for storage — no Redis required.
// Concurrency: single-process polling (safe for Render.com single-instance deployment).

const prisma = require("../../lib/prisma");
const { auditLog } = require('../audit/auditLogger');


// Backoff delays per attempt (ms): 1min, 5min, 15min, 1hr, 4hr
const BACKOFF_MS = [60_000, 300_000, 900_000, 3_600_000, 14_400_000];

function getNextRetryAt(attempts) {
  const delay = BACKOFF_MS[Math.min(attempts, BACKOFF_MS.length - 1)];
  return new Date(Date.now() + delay);
}

// Enqueue a new job
async function enqueue(type, payload, options = {}) {
  return prisma.jobQueue.create({
    data: {
      type,
      payload,
      status: 'pending',
      maxAttempts: options.maxAttempts || 5,
      scheduledAt: options.scheduledAt || new Date(),
    },
  });
}

// Job handler registry: { type: async (payload) => void }
const _handlers = {};

function registerHandler(type, handler) {
  _handlers[type] = handler;
}

// Process one pending job — returns true if a job was processed, false if queue was empty
async function processNext() {
  // Find oldest pending job that is due
  const job = await prisma.jobQueue.findFirst({
    where: {
      status: 'pending',
      nextRetryAt: { lte: new Date() },
    },
    orderBy: { scheduledAt: 'asc' },
  });

  if (!job) return false;

  // Mark as processing
  await prisma.jobQueue.update({
    where: { id: job.id },
    data: { status: 'processing', processedAt: new Date() },
  });

  const handler = _handlers[job.type];
  if (!handler) {
    await prisma.jobQueue.update({
      where: { id: job.id },
      data: { status: 'dead', lastError: `No handler registered for type: ${job.type}` },
    });
    return true;
  }

  try {
    await handler(job.payload);
    await prisma.jobQueue.update({
      where: { id: job.id },
      data: { status: 'completed', completedAt: new Date() },
    });
  } catch (err) {
    const newAttempts = job.attempts + 1;
    if (newAttempts >= job.maxAttempts) {
      await prisma.jobQueue.update({
        where: { id: job.id },
        data: { status: 'dead', attempts: newAttempts, lastError: err.message },
      });
      await auditLog({
        action: 'job_queue_dead_letter',
        entityType: 'JobQueue',
        entityId: job.id,
        details: { type: job.type, attempts: newAttempts, error: err.message },
      });
    } else {
      await prisma.jobQueue.update({
        where: { id: job.id },
        data: {
          status: 'pending',
          attempts: newAttempts,
          lastError: err.message,
          nextRetryAt: getNextRetryAt(newAttempts),
        },
      });
    }
  }

  return true;
}

// Poll loop — call this once at startup; runs every 10 seconds
let _polling = false;
function startPolling(intervalMs = 10_000) {
  if (_polling) return;
  _polling = true;
  const loop = async () => {
    try { await processNext(); } catch (e) { /* ignore poll errors */ }
    setTimeout(loop, intervalMs);
  };
  setTimeout(loop, intervalMs);
}

// Stats for health check
async function getStats() {
  const [pending, processing, failed, dead] = await Promise.all([
    prisma.jobQueue.count({ where: { status: 'pending' } }),
    prisma.jobQueue.count({ where: { status: 'processing' } }),
    prisma.jobQueue.count({ where: { status: 'failed' } }),
    prisma.jobQueue.count({ where: { status: 'dead' } }),
  ]);
  return { pending, processing, failed, dead };
}

module.exports = { enqueue, registerHandler, processNext, startPolling, getStats };
