import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dish } from './entities/dish.entity';
import { DishService } from './dish.service';
import { Restaurant } from '../restaurnats/entities/restaurant.entity';
import { RestaurantRepository } from '../restaurnats/repositories/restaurant.repository';
import { DishResolver } from './dish.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Dish, Restaurant])],
  providers: [DishService, RestaurantRepository, DishResolver],
})
export class DishModule {}
