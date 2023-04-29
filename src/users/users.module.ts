import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [TypeOrmModule.forFeature([User])], // provider 에 지정된 service를 사용하기 위해서 필요한 모듈?
  providers: [UsersResolver, UsersService, ConfigService], // 해당 모듈에서 사용할 service?
  exports: [UsersService], // 외부에서 사용할수 있는 모듈내의 서비스나 클래스를 지정
})
export class UsersModule {}
