import { DynamicModule, Global, Module } from '@nestjs/common';
import { JwtService } from './jwt.service';
import { CONFIG_OPTIONS } from './jwt.constants';
import { JwtModuleOptions } from './jwt.interfaces';
import { UsersService } from '../users/users.service';

@Module({})
@Global()
export class JwtModule {
  /*
    provider 는 provide, useClass 를 인자로 받지만 2개가 동일할 경우에는 1개로 줄여 써도 무방
    ex)
    providers: [
      { provide: '1111', useValue: '3333' } - 값을 지정할수도 있음
    ]

    spring 으로 치면 property 같은거?
   */
  static forRoot(options: JwtModuleOptions): DynamicModule {
    return {
      module: JwtModule,
      exports: [JwtService],
      providers: [JwtService, { provide: CONFIG_OPTIONS, useValue: options }],
    };
  }
}
