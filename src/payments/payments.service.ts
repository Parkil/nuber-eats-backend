import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { DataSource, LessThan, Repository } from 'typeorm';
import {
  CreatePaymentsInput,
  CreatePaymentsOutput,
} from './dtos/create-payments.dto';
import { User } from '../users/entities/user.entity';
import { GetPaymentsOutput } from './dtos/get-payments.dto';
import { Interval } from '@nestjs/schedule';
import { errorMsg, successMsg } from '../common/msg/msg.util';
import { RestaurantRepository } from '../restaurnats/repositories/restaurant.repository';
import { Restaurant } from '../restaurnats/entities/restaurant.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Payment) private readonly payments: Repository<Payment>,
    private readonly restaurants: RestaurantRepository
  ) {}

  async createPayments(
    { transactionId, restaurantId }: CreatePaymentsInput,
    owner: User
  ): Promise<CreatePaymentsOutput> {
    try {
      return await this.dataSource.transaction(async (entityManager) => {
        const restaurant = await this.restaurants.findOne({
          where: { id: restaurantId },
        });

        if (!restaurant) {
          return errorMsg('Restaurant Not Found');
        }

        if (restaurant.ownerId !== owner.id) {
          return errorMsg('Restaurant Not Found');
        }

        restaurant.isPromoted = true;

        const date = new Date();
        date.setDate(date.getDate() + 7); // 현재일로부터 7일 후

        restaurant.promotedUntil = date;

        await entityManager.save(Restaurant, restaurant);

        await entityManager.save(
          Payment,
          this.payments.create({
            transactionId,
            user: owner,
            restaurant,
          })
        );

        return successMsg();
      });
    } catch (e) {
      return errorMsg(e);
    }
  }

  async getPayments(owner: User): Promise<GetPaymentsOutput> {
    try {
      const list = await this.payments.find({
        relations: ['user'],
        where: { user: { id: owner.id } },
      });

      return successMsg({ payments: list });
    } catch (e) {
      return errorMsg(e);
    }
  }

  @Interval(200000)
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

