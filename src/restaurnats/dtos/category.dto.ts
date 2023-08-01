import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsString } from 'class-validator';
import { Category } from '../entities/category.entity';
import {
  PaginationInput,
  PaginationOutput,
} from '../../common/dtos/pagination.dto';

@InputType()
export class CategoryInput extends PaginationInput {
  @Field(() => String)
  @IsString()
  slug: string;
}

@ObjectType()
export class CategoryOutput extends PaginationOutput {
  @Field(() => Category, { nullable: true })
  category?: Category;
}
