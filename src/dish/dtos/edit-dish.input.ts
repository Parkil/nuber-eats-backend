import { Field, InputType, ObjectType, PartialType } from '@nestjs/graphql';
import { CoreOutput } from '../../common/dtos/output.dto';
import { IsNumber } from 'class-validator';
import { CreateDishInput } from './create-dish.input';

@InputType()
export class EditDishInput extends PartialType(CreateDishInput) {
  @Field(() => Number)
  @IsNumber()
  dishId: number;
}

@ObjectType()
export class EditDishOutput extends CoreOutput {}
