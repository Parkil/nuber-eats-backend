import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Category } from '../entities/category.entity';

/*
  CustomRepository 설정
  원래 Repository 에 부가 가능을 부여 해당 파일은 module 에서 provide 를 정의하여 사용할 수 있다
 */
@Injectable()
export class CategoryRepository extends Repository<Category> {
  constructor(private readonly dataSource: DataSource) {
    super(Category, dataSource.createEntityManager());
  }

  async getOrCreateCategory(name: string): Promise<Category> {
    //검색의 용이성을 위해 slug 생성 ex) Korea bbq, korea Bbq, korea-bbq 모두를 1개로 인식하고 검색하도록 처리
    const categoryName = name.trim().toLowerCase();
    const categorySlug = categoryName.replace(/ /g, '-');

    let category = await this.findOne({
      where: {
        slug: categorySlug,
      },
    });

    if (!category) {
      category = await this.save(
        this.create({
          slug: categorySlug,
          name: categoryName,
        })
      );
    }

    return category;
  }
}
