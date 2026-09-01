export async function runBobQueueTick({ claimJob, closeSessions, completeJob, scheduleRetry }) {
  const claimed = await claimJob();
  if (!claimed?.job) return { status: "idle" };
  try {
    const result = await closeSessions(claimed.job);
    await completeJob({ jobId: claimed.job.id, result, error: "" });
    return { status: "completed", jobId: claimed.job.id };
  } catch (error) {
    const code = String(error?.message || error || "bob_session_close_failed").replace(/\s+/g, " ").trim();
    if (isRetryableBobError(code) && typeof scheduleRetry === "function") {
      await scheduleRetry({ jobId: claimed.job.id, error: code });
      return { status: "retry_waiting", jobId: claimed.job.id, error: code };
    }
    await completeJob({ jobId: claimed.job.id, result: undefined, error: code });
    return { status: "failed", jobId: claimed.job.id, error: code };
  }
}

export function isRetryableBobError(value) {
  const code = String(value || "").toLowerCase();
  if (!code || /bob_pending_limit_exceeded|bob_verification_failed|bob_invalid_search_range/.test(code)) return false;
  return /bob_login_required|bob_cdp_context_unavailable|bob_chrome_not_found|bob_native_request_failed|timeout|timed out|net::|econn|browsertype\.launch|target page|page\.goto|bridge/.test(code);
}
