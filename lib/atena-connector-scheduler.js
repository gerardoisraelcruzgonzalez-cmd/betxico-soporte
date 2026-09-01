export async function runAtenaQueueTick({ claimJob, lookupJob, completeJob }) {
  const claimed = await claimJob();
  if (!claimed?.job) return { status: "idle" };
  try {
    const result = await lookupJob(claimed.job);
    await completeJob({ jobId: claimed.job.id, result, error: "" });
    return { status: "completed", jobId: claimed.job.id };
  } catch (error) {
    const code = cleanError(error) || "atena_lookup_failed";
    await completeJob({ jobId: claimed.job.id, result: undefined, error: code });
    return { status: "failed", jobId: claimed.job.id, error: code };
  }
}

function cleanError(error) {
  return String(error?.message || error || "").replace(/\s+/g, " ").trim();
}
