import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entites/order.entity';
import { Repository } from 'typeorm';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { User } from '../users/entities/user.entity';
import { RestaurantRepository } from '../restaurnats/repositories/restaurant.repository';
import { OrderItem } from './entites/order-item.entity';
import { Dish } from '../dish/entities/dish.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Dish) private readonly dishes: Repository<Dish>,
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderitems: Repository<OrderItem>,
    private readonly restaurants: RestaurantRepository
  ) {}

  async createOrder(
    { restaurantId, items }: CreateOrderInput,
    customer: User
  ): Promise<CreateOrderOutput> {
    try {
      const restaurant = await this.restaurants.findOne({
        where: { id: restaurantId },
      });

      if (!restaurant) {
        throw 'Restaurant not found';
      }

      for (const item of items) {
        const dish = await this.dishes.findOne({ where: { id: item.dishId } });

        if (!dish) {
          throw 'Dish Not Found';
        }

        for (const itemOption of item.options) {
          const dishOption = dish.options.find(
            (dishOption) => dishOption.name === itemOption.name
          );

          if (dishOption) {
            if (dishOption.extra) {
              // option 자체에 붙는 추가 요금
              console.log(`${dishOption.extra}`);
            } else {
              // option 내부의 선택사항에 붙는 추가 요금
              const dishOptionChoice = dishOption.choices.find(
                (optionChoice) => optionChoice.name == itemOption.choice
              );

              if (dishOptionChoice?.extra) {
                console.log(`${dishOptionChoice.extra}`);
              }
            }
          }
        }

        /*
        await this.orderitems.save(
          this.orderitems.create({
            dish,
            options: item.options,
          })
        );*/
      }

      /*
      const order = await this.orders.save(
        this.orders.create({
          customer,
          restaurant,
        })
      );

       */

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
