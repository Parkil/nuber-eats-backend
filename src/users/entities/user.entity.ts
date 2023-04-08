import { Column, Entity } from 'typeorm';
import { CoreEntity } from '../../common/entities/core.entity';
import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

enum UserRole {
  Client,
  Owner,
  Delivery,
}

registerEnumType(UserRole, { name: 'UserRole' });

@InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class User extends CoreEntity {
  @Field(() => String)
  @IsString()
  @Column()
  email: string;

  @Field(() => String)
  @IsString()
  @Column()
  password: string;

  @Field(() => UserRole)
  @IsNotEmpty()
  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;
}
