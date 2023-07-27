import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth.guard';

/*
  전역으로 무조건 인증(로그인)을 해야지만 해당 endpoint 를 실행할수 있도록 설정
 */
@Module({
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
export class AuthModule {}
