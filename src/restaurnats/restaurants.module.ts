import { Module } from '@nestjs/common';
import { RestaurantsResolver } from './restaurants.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantService } from './restaurant.service';
import { Category } from './entities/category.entity';
import { CategoryRepository } from './repositories/category.repository';
import { RestaurantRepository } from './repositories/restaurant.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Restaurant, Category])],
  providers: [
    RestaurantsResolver,
    RestaurantService,
    CategoryRepository,
    RestaurantRepository,
  ],
})
export class RestaurantsModule {}
