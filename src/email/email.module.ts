import { DynamicModule, Global, Module } from '@nestjs/common';
import { CONFIG_OPTIONS } from '../common/common.constants';
import { EmailOptions } from './email.interface';
import { EmailService } from './email.service';

@Module({})
@Global()
export class EmailModule {
  static forRoot(options: EmailOptions): DynamicModule {
    return {
      module: EmailModule,
      exports: [EmailService],
      providers: [{ provide: CONFIG_OPTIONS, useValue: options }, EmailService],
    };
  }
}
