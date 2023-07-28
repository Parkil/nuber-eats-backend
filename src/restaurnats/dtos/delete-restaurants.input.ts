import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from '../../common/dtos/output.dto';
import { IsNumber } from 'class-validator';

@InputType()
export class DeleteRestaurantsInput {
  @Field(() => Number)
  @IsNumber()
  id: number;
}

@ObjectType()
export class DeleteRestaurantsOutput extends CoreOutput {}
