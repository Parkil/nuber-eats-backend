import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Injectable } from '@nestjs/common';
import { CreateAccountInput } from './dtos/create-account.dto';
import { LoginInput } from './dtos/login.dto';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '../jwt/jwt.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly config: ConfigService,
    private readonly jwtService: JwtService
  ) {
    jwtService.hello();
  }

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

      const token = jwt.sign({ id: user.id }, this.config.get('SECRET_KEY'));
      return {
        ok: true,
        token: token,
      };
    } catch (error) {
      return { ok: false, error };
    }
  }
}
