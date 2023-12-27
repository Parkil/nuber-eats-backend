import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from '../../common/dtos/output.dto';
import { IsNumber } from 'class-validator';

@InputType()
export class DeleteDishInput {
  @Field(() => Number)
  @IsNumber()
  dishId: number;
}

@ObjectType()
export class DeleteDishOutput extends CoreOutput {}
