import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { Repository } from 'typeorm';
import {
  CreatePaymentsInput,
  CreatePaymentsOutput,
} from './dtos/create-payments.dto';
import { User } from '../users/entities/user.entity';
import { Restaurant } from '../restaurnats/entities/restaurant.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment) private readonly payments: Repository<Payment>,
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>
  ) {}

  async createPayments(
    { transactionId, restaurantId }: CreatePaymentsInput,
    owner: User
  ): Promise<CreatePaymentsOutput> {
    try {
      const restaurant = await this.restaurants.findOne({
        where: { id: restaurantId },
      });

      if (!restaurant) {
        throw 'Restaurant Not Found';
      }

      if (restaurant.ownerId !== owner.id) {
        throw 'This restaurant belong to you';
      }

      await this.payments.save(
        this.payments.create({
          transactionId,
          user: owner,
          restaurant,
        })
      );

      return {
        ok: true,
      };
    } catch (e) {
      return {
        ok: false,
        error: e,
      };
    }
  }
}
