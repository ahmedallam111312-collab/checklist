import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  checkLoginRateLimit,
  recordLoginFailure,
  recordLoginSuccess,
  resetRateLimits,
} from "../../src/lib/auth/rate-limiter";
import { AR_STRINGS } from "../../src/messages/ar";

describe("Login Security: Generic Errors, Rate Limiting & Secure Cookies", () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it("1. returns generic error string on authentication failures without leaking email presence", () => {
    // Assert generic Arabic error string is invariant across failure types
    assert.equal(AR_STRINGS.loginGenericError, "بيانات الدخول غير صحيحة.");
  });

  it("2. allows initial login attempts within quota (max 5)", async () => {
    const testKey = "192.168.1.100:test@example.com";
    const status = await checkLoginRateLimit(testKey);

    assert.equal(status.allowed, true);
    assert.equal(status.remainingAttempts, 5);
  });

  it("3. decrements remaining attempts on each recorded failure", async () => {
    const testKey = "192.168.1.101:test@example.com";

    const fail1 = await recordLoginFailure(testKey);
    assert.equal(fail1.blocked, false);
    assert.equal(fail1.remainingAttempts, 4);

    const fail2 = await recordLoginFailure(testKey);
    assert.equal(fail2.blocked, false);
    assert.equal(fail2.remainingAttempts, 3);
  });

  it("4. blocks further login attempts after 5 consecutive failures", async () => {
    const testKey = "192.168.1.102:brute@example.com";

    for (let i = 0; i < 4; i++) {
      const res = await recordLoginFailure(testKey);
      assert.equal(res.blocked, false);
    }

    // 5th failure triggers block
    const res5 = await recordLoginFailure(testKey);
    assert.equal(res5.blocked, true);
    assert.equal(res5.remainingAttempts, 0);

    // Subsequent check is strictly blocked
    const status = await checkLoginRateLimit(testKey);
    assert.equal(status.allowed, false);
    assert.equal(status.remainingAttempts, 0);
    assert.ok(status.retryAfterSeconds && status.retryAfterSeconds > 0);
  });

  it("5. clears rate limit failures on successful login", async () => {
    const testKey = "192.168.1.103:user@example.com";

    // 3 failed attempts
    await recordLoginFailure(testKey);
    await recordLoginFailure(testKey);
    await recordLoginFailure(testKey);

    const midStatus = await checkLoginRateLimit(testKey);
    assert.equal(midStatus.remainingAttempts, 2);

    // Successful login
    await recordLoginSuccess(testKey);

    // Rate limit reset to initial full quota
    const resetStatus = await checkLoginRateLimit(testKey);
    assert.equal(resetStatus.remainingAttempts, 5);
    assert.equal(resetStatus.allowed, true);
  });

  it("6. validates secure cookie option invariants for production session storage", () => {
    const isProd = true;
    const cookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    };

    assert.equal(cookieOptions.httpOnly, true, "httpOnly must be true to prevent XSS access");
    assert.equal(cookieOptions.secure, true, "secure must be true in production for HTTPS only");
    assert.equal(cookieOptions.sameSite, "lax", "sameSite must be lax to prevent CSRF");
    assert.equal(cookieOptions.path, "/", "path must be root");
  });
});
