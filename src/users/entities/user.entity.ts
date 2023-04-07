import { Column, Entity } from 'typeorm';
import { CoreEntity } from '../../common/entities/core.entity';
import { Field, InputType } from '@nestjs/graphql';

type UserRole = 'client' | 'owner' | 'delivery';

@InputType({ isAbstract: true })
@Entity()
export class User extends CoreEntity {
  @Field(() => String)
  @Column()
  email: string;

  @Field(() => String)
  @Column()
  password: string;

  @Field(() => String)
  @Column()
  role: UserRole;
}
