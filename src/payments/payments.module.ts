import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { PaymentsResolver } from './payments.resolver';
import { PaymentsService } from './payments.service';
import { RestaurantRepository } from '../restaurnats/repositories/restaurant.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Payment])],
  providers: [PaymentsResolver, PaymentsService, RestaurantRepository],
})
export class PaymentsModule {}

