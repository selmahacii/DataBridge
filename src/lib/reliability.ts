// Exponential Backoff & Circuit Breaker Logic

export class CircuitBreaker {
  private failureThreshold: number;
  private recoveryTimeout: number;
  private failures: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private nextAttempt: number = 0;

  constructor(failureThreshold = 5, recoveryTimeoutMs = 30000) {
    this.failureThreshold = failureThreshold;
    this.recoveryTimeout = recoveryTimeoutMs;
  }

  async invoke<T>(action: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() > this.nextAttempt) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit Breaker OPEN: Failing fast to prevent cascading load.');
      }
    }

    try {
      const response = await action();
      this.reset();
      return response;
    } catch (err) {
      this.recordFailure();
      throw err;
    }
  }

  private recordFailure() {
    this.failures += 1;
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.recoveryTimeout;
    }
  }

  private reset() {
    this.failures = 0;
    this.state = 'CLOSED';
  }
}

export async function withExponentialBackoff<T>(
  action: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await action();
    } catch (error: any) {
      attempt++;
      if (attempt >= maxRetries) throw error;
      
      const jitter = Math.random() * 200;
      await new Promise((res) => setTimeout(res, (delayMs * Math.pow(2, attempt)) + jitter));
    }
  }
  throw new Error('Unreachable code');
}

// Global registry for external API breakers
export const APICircuitBreakers = {
  meta: new CircuitBreaker(5, 60000), // More lenient mapping for Meta API
  ga4: new CircuitBreaker(5, 30000),
  linkedin: new CircuitBreaker(3, 10000),
};
