import { InputType, PartialType } from '@nestjs/graphql';
import { CreateRestaurantsDto } from './create-restaurants.dto';

@InputType()
export class UpdateRestaurantDto extends PartialType(CreateRestaurantsDto) {}
