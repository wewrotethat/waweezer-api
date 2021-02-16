import {inject} from '@loopback/core';
import {compare, genSalt, hash} from 'bcryptjs';
import {HashPasswordBindings} from '../keys';

export interface HashPasswordService<T = string> {
  hashPassword(password: T): Promise<T>;
  comparePassword(providedPass: T, storedPass: T): Promise<boolean>;
}
export class BcryptHasher implements HashPasswordService<string> {
  constructor(
    @inject(HashPasswordBindings.ROUNDS)
    private readonly rounds: number,
  ) {}

  async hashPassword(password: string): Promise<string> {
    const salt = await genSalt(this.rounds);
    return hash(password, salt);
  }

  async comparePassword(
    providedPass: string,
    storedPass: string,
  ): Promise<boolean> {
    const passwordIsMatched = await compare(providedPass, storedPass);
    return passwordIsMatched;
  }
}
