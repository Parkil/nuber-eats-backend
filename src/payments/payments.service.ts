import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { LessThan, Repository } from 'typeorm';
import {
  CreatePaymentsInput,
  CreatePaymentsOutput,
} from './dtos/create-payments.dto';
import { User } from '../users/entities/user.entity';
import { Restaurant } from '../restaurnats/entities/restaurant.entity';
import { GetPaymentsOutput } from './dtos/get-payments.dto';
import { Cron, Interval, SchedulerRegistry } from '@nestjs/schedule';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment) private readonly payments: Repository<Payment>,
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    private readonly schedulerRegistry: SchedulerRegistry
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

      restaurant.isPromoted = true;

      const date = new Date();
      date.setDate(date.getDate() + 7); // 현재일로부터 7일 후

      restaurant.promotedUntil = date;

      await this.restaurants.save(restaurant);

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

  async getPayments(owner: User): Promise<GetPaymentsOutput> {
    try {
      const list = await this.payments.find({
        relations: ['user'],
        where: { user: { id: owner.id } },
      });

      return {
        ok: true,
        payments: list,
      };
    } catch (e) {
      return {
        ok: false,
        error: e,
      };
    }
  }

  @Interval(2000)
  async checkPromotedRestaurants() {
    const restaurants = await this.restaurants.find({
      where: { isPromoted: true, promotedUntil: LessThan(new Date()) },
    });

    for (const target of restaurants) {
      target.isPromoted = false;
      target.promotedUntil = null;
      await this.restaurants.save(target);
    }
  }
}
