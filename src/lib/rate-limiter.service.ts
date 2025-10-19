const REQUEST_LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

const userRequests = new Map<string, number[]>();

function checkLimit(userId: string): boolean {
  const now = Date.now();
  const requests = userRequests.get(userId) ?? [];

  const recentRequests = requests.filter((timestamp) => now - timestamp < WINDOW_MS);

  if (recentRequests.length >= REQUEST_LIMIT) {
    return false;
  }

  recentRequests.push(now);
  userRequests.set(userId, recentRequests);
  return true;
}

export const rateLimiterService = {
  checkLimit,
};
