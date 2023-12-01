import { Field, InputType, ObjectType } from '@nestjs/graphql';
import {
  PaginationInput,
  PaginationOutput,
} from '../../common/dtos/pagination.dto';
import { Restaurant } from '../entities/restaurant.entity';
import { IsOptional, IsString } from 'class-validator';

@InputType()
export class RestaurantsInput extends PaginationInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  query?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  slug?: string;
}

@ObjectType()
export class RestaurantsOutput extends PaginationOutput {
  @Field(() => [Restaurant], { nullable: true })
  results?: Restaurant[];
}
