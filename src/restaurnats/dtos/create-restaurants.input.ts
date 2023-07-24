import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { Restaurant } from '../entities/restaurant.entity';
import { CoreOutput } from '../../common/dtos/output.dto';
import { IsString } from 'class-validator';

@InputType()
export class CreateRestaurantsInput extends PickType(
  Restaurant,
  ['name', 'coverImg', 'address'],
  InputType
) {
  @Field(() => String)
  @IsString()
  categoryName: string;
}

@ObjectType()
export class CreateRestaurantsOutput extends CoreOutput {}
