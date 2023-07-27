import { Field, InputType, ObjectType, PartialType } from '@nestjs/graphql';
import { CoreOutput } from '../../common/dtos/output.dto';
import { CreateRestaurantsInput } from './create-restaurants.input';
import { IsNumber } from 'class-validator';

@InputType()
export class EditRestaurantsInput extends PartialType(CreateRestaurantsInput) {
  @Field(() => Number)
  @IsNumber()
  restaurantId: number;
}

@ObjectType()
export class EditRestaurantsOutput extends CoreOutput {}
