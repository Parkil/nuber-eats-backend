import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { Restaurant } from '../entities/restaurant.entity';
import { CoreOutput } from '../../common/dtos/output.dto';
import { IsString } from 'class-validator';

@InputType()
export class OwnerRestaurantInput extends PickType(
  Restaurant,
  ['id'],
  InputType
) {}

@ObjectType()
export class OwnerRestaurantOutput extends CoreOutput {
  @Field(() => Restaurant, { nullable: true })
  restaurant?: Restaurant;
}
