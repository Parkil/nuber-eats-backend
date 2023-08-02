import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Restaurant } from '../entities/restaurant.entity';
import { IsString } from 'class-validator';
import { PaginationInput, PaginationOutput } from '../../common/dtos/pagination.dto';

@InputType()
export class SearchRestaurantsInput extends PaginationInput{
  @Field(() => String)
  @IsString()
  query: string;
}

@ObjectType()
export class SearchRestaurantsOutput extends PaginationOutput {
  @Field(() => [Restaurant])
  searchResult?: Restaurant[];
}
