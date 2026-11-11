import { hash, verify } from '@node-rs/argon2';
import { Injectable, type OnModuleInit } from '@nestjs/common';

// argon2id with OWASP's baseline parameters (19 MiB, 2 iterations).
const OPTIONS = { memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;

@Injectable()
export class Passwords implements OnModuleInit {
  private dummyHash = '';

  async onModuleInit(): Promise<void> {
    // Verified against when the email is unknown, so a failed login takes the
    // same time whether or not the account exists.
    this.dummyHash = await hash('not-a-real-password-0', OPTIONS);
  }

  hash(password: string): Promise<string> {
    return hash(password, OPTIONS);
  }

  /** Verifies against `passwordHash`, or against a dummy hash when there is no user. */
  async verify(passwordHash: string | undefined, password: string): Promise<boolean> {
    const matches = await verify(passwordHash ?? this.dummyHash, password);
    return passwordHash !== undefined && matches;
  }
}
