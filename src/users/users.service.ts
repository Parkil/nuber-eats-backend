import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Injectable } from '@nestjs/common';
import { CreateAccountInput } from './dtos/create-account.dto';
import { LoginInput } from './dtos/login.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>
  ) {}

  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<{ error?: string; ok: boolean }> {
    try {
      const exists = await this.users.findOne({
        where: {
          email: email,
        },
      });

      if (exists) {
        return { ok: false, error: 'There is a user with that email already' };
      }

      await this.users.save(this.users.create({ email, password, role }));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: 'can not create account' };
    }
  }

  async login({
    email,
    password,
  }: LoginInput): Promise<{ ok: boolean; error?: string; token?: string }> {
    try {
      const user = await this.users.findOne({
        where: {
          email: email,
        },
      });

      if (!user) {
        return { ok: false, error: 'User Not Found' };
      }

      const passwordCorrect = await user.checkPassword(password);
      if (!passwordCorrect) {
        return { ok: false, error: 'Wrong Password' };
      }

      return {
        ok: true,
        token: '1112223333',
      };
    } catch (error) {
      return { ok: false, error };
    }
  }
}
