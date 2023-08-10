import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entites/order.entity';
import { OrderResolver } from './order.resolver';
import { OrderService } from './order.service';
import { RestaurantRepository } from '../restaurnats/repositories/restaurant.repository';
import { OrderItem } from './entites/order-item.entity';
import { Dish } from '../dish/entities/dish.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Dish])],
  providers: [OrderResolver, OrderService, RestaurantRepository],
})
export class OrdersModule {}
