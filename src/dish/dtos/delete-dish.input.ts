import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from '../../common/dtos/output.dto';
import { Dish } from '../entities/dish.entity';
import { IsNumber } from 'class-validator';

@InputType()
export class DeleteDishInput {
  @Field(() => Number)
  @IsNumber()
  dishId: number;
}

@ObjectType()
export class DeleteDishOutput extends CoreOutput {}
