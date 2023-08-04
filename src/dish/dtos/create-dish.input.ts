import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from '../../common/dtos/output.dto';
import { Dish } from '../entities/dish.entity';
import { IsNumber } from 'class-validator';

@InputType()
export class CreateDishInput extends PickType(
  Dish,
  ['name', 'price', 'description', 'options'],
  InputType
) {
  @Field(() => Number)
  @IsNumber()
  restaurantId: number;
}

@ObjectType()
export class CreateDishOutput extends CoreOutput {}
