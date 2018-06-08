import { AbstractRepository, EntityRepository, SelectQueryBuilder } from 'typeorm';
import { CreateProductDto } from '../entity/product/create-product.dto';
import { ProductTranslationEntity } from '../entity/product/product-translation.entity';
import { ProductEntity } from '../entity/product/product.entity';
import { Product } from '../entity/product/product.interface';
import { LanguageCode } from '../locale/language-code';
import { translateDeep } from '../locale/translate-entity';

@EntityRepository(ProductEntity)
export class ProductRepository extends AbstractRepository<ProductEntity> {
    /**
     * Returns an array of Products including ProductVariants, translated into the
     * specified language.
     */
    find(languageCode: LanguageCode): Promise<ProductEntity[]> {
        return this.getProductQueryBuilder(languageCode).getMany();
    }

    /**
     * Returns single Product including ProductVariants, translated into the
     * specified language.
     */
    findOne(id: number, languageCode: LanguageCode): Promise<ProductEntity | undefined> {
        return this.getProductQueryBuilder(languageCode)
            .andWhere('product.id = :id', { id })
            .getOne();
    }

    /**
     * Creates a new Product with one or more ProductTranslations.
     */
    async create(productEntity: ProductEntity, translations: ProductTranslationEntity[]): Promise<ProductEntity> {
        for (const translation of translations) {
            await this.manager.save(translation);
        }
        productEntity.translations = translations;
        return this.manager.save(productEntity);
    }

    private getProductQueryBuilder(languageCode: LanguageCode): SelectQueryBuilder<ProductEntity> {
        return this.manager
            .createQueryBuilder(ProductEntity, 'product')
            .leftJoinAndSelect('product.variants', 'variant')
            .leftJoinAndSelect('product.optionGroups', 'option_group')
            .leftJoinAndSelect(
                'product.translations',
                'product_translation',
                'product_translation.languageCode = :code',
            )
            .leftJoinAndSelect(
                'variant.translations',
                'product_variant_translation',
                'product_variant_translation.languageCode = :code',
            )
            .leftJoinAndSelect(
                'option_group.translations',
                'option_group_translation',
                'option_group_translation.languageCode = :code',
            )
            .leftJoinAndSelect('variant.options', 'variant_options')
            .leftJoinAndSelect(
                'variant_options.translations',
                'variant_options_translation',
                'variant_options_translation.languageCode = :code',
            )
            .setParameters({ code: languageCode });
    }
}