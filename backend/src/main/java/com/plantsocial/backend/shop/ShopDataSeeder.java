package com.plantsocial.backend.shop;

import com.plantsocial.backend.shop.model.Product;
import com.plantsocial.backend.shop.model.ProductCategory;
import com.plantsocial.backend.shop.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
@Order(2)
public class ShopDataSeeder implements CommandLineRunner {

    private final ProductRepository productRepository;

    @Override
    public void run(String... args) {
        if (productRepository.countByActiveTrue() > 0) {
            log.info("Shop products already seeded, skipping...");
            return;
        }

        log.info("Seeding shop products...");

        List<Product> products = List.of(
                Product.builder()
                        .name("Aroid Premium Soil Mix")
                        .slug("aroid-premium-soil-mix")
                        .shortDescription("Perfect for Monstera, Philodendron & Alocasia")
                        .description(
                                "Our premium Aroid Soil Mix is specially formulated for tropical aroids like Monstera, Philodendron, and Alocasia. The chunky, well-draining formula mimics the epiphytic growing conditions these plants love. Contains orchid bark, perlite, coco coir, worm castings, and activated charcoal for optimal drainage and nutrition. Provides approximately 180 days of slow-release nutrients.")
                        .price(new BigDecimal("12.99"))
                        .compareAtPrice(new BigDecimal("16.99"))
                        .category(ProductCategory.SOIL_MIX)
                        .imageUrl("/assets/shop/aroid-mix.jpg")
                        .stock(150)
                        .weight("5L")
                        .ingredients(
                                "Orchid Bark, Perlite, Coco Coir, Worm Castings, Activated Charcoal, Slow-release Fertilizer")
                        .rating(4.8)
                        .reviewCount(234)
                        .featured(true)
                        .build(),

                Product.builder()
                        .name("Cacti & Succulent Mix")
                        .slug("cacti-succulent-mix")
                        .shortDescription("Fast-draining mix for desert dwellers")
                        .description(
                                "Professionally crafted for cacti, succulents, and other drought-tolerant plants. This ultra-fast-draining mix prevents root rot while providing essential minerals. Contains pumice, coarse sand, perlite, and a minimal amount of organic matter — exactly what your desert plants crave.")
                        .price(new BigDecimal("11.49"))
                        .category(ProductCategory.SOIL_MIX)
                        .imageUrl("/assets/shop/cacti-mix.jpg")
                        .stock(200)
                        .weight("5L")
                        .ingredients("Pumice, Coarse Sand, Perlite, Coco Coir, Zeolite")
                        .rating(4.7)
                        .reviewCount(189)
                        .featured(true)
                        .build(),

                Product.builder()
                        .name("Orchid Bark Chunks")
                        .slug("orchid-bark-chunks")
                        .shortDescription("Premium pine bark for orchids & epiphytes")
                        .description(
                                "High-quality, kiln-dried pine bark chunks ideal for orchids, bromeliads, and other epiphytic plants. Provides excellent aeration and drainage while slowly releasing natural nutrients. Available in medium-grade chunks (15-25mm) perfect for most orchid varieties.")
                        .price(new BigDecimal("8.99"))
                        .category(ProductCategory.SOIL_IMPROVER)
                        .imageUrl("/assets/shop/orchid-bark.jpg")
                        .stock(300)
                        .weight("5L")
                        .ingredients("100% Kiln-dried Pine Bark")
                        .rating(4.9)
                        .reviewCount(156)
                        .featured(false)
                        .build(),

                Product.builder()
                        .name("Premium Perlite")
                        .slug("premium-perlite")
                        .shortDescription("Volcanic glass for superior drainage")
                        .description(
                                "Ultra-lightweight expanded volcanic glass that dramatically improves soil drainage and aeration. Prevents soil compaction and promotes healthy root growth. Food-grade quality, pH neutral, and reusable. Essential ingredient for custom soil mix recipes.")
                        .price(new BigDecimal("6.99"))
                        .category(ProductCategory.SOIL_IMPROVER)
                        .imageUrl("/assets/shop/perlite.jpg")
                        .stock(400)
                        .weight("5L")
                        .ingredients("100% Expanded Perlite")
                        .rating(4.6)
                        .reviewCount(312)
                        .featured(false)
                        .build(),

                Product.builder()
                        .name("Coco Coir Block")
                        .slug("coco-coir-block")
                        .shortDescription("Sustainable coconut fiber substrate")
                        .description(
                                "Triple-washed, low-EC coconut coir that expands to 5 liters when hydrated. This sustainable peat alternative retains moisture while maintaining excellent aeration. Ideal as a base for custom mixes or as a standalone growing medium for tropical plants.")
                        .price(new BigDecimal("5.49"))
                        .category(ProductCategory.SOIL_IMPROVER)
                        .imageUrl("/assets/shop/coco-coir.jpg")
                        .stock(500)
                        .weight("650g (expands to 5L)")
                        .ingredients("100% Coconut Coir Fiber")
                        .rating(4.5)
                        .reviewCount(198)
                        .featured(false)
                        .build(),

                Product.builder()
                        .name("Worm Castings Organic")
                        .slug("worm-castings-organic")
                        .shortDescription("Nature's best slow-release fertilizer")
                        .description(
                                "Premium vermicompost produced from red wiggler worms fed on organic vegetable matter. Rich in beneficial microorganisms, humic acids, and essential nutrients. Gentle enough to use directly on seedlings. Improves soil structure and water retention naturally.")
                        .price(new BigDecimal("9.99"))
                        .compareAtPrice(new BigDecimal("12.99"))
                        .category(ProductCategory.PLANT_FOOD)
                        .imageUrl("/assets/shop/worm-castings.jpg")
                        .stock(250)
                        .weight("2.5L")
                        .ingredients("100% Organic Vermicompost")
                        .rating(4.8)
                        .reviewCount(267)
                        .featured(true)
                        .build(),

                Product.builder()
                        .name("Liquid Plant Food Concentrate")
                        .slug("liquid-plant-food")
                        .shortDescription("All-purpose NPK 7-3-6 formula")
                        .description(
                                "Concentrated liquid fertilizer formulated specifically for houseplants. Balanced NPK ratio (7-3-6) with added micronutrients including iron, manganese, and zinc. One bottle makes up to 50 liters of feed solution. Just add 5ml per liter of water.")
                        .price(new BigDecimal("14.99"))
                        .category(ProductCategory.PLANT_FOOD)
                        .imageUrl("/assets/shop/liquid-food.jpg")
                        .stock(180)
                        .weight("500ml")
                        .ingredients("NPK 7-3-6, Iron, Manganese, Zinc, Boron, Copper, Molybdenum")
                        .rating(4.7)
                        .reviewCount(143)
                        .featured(true)
                        .build(),

                Product.builder()
                        .name("Sphagnum Moss Premium")
                        .slug("sphagnum-moss-premium")
                        .shortDescription("Long-fiber New Zealand sphagnum")
                        .description(
                                "Premium long-fiber sphagnum moss sourced from New Zealand. Exceptional water retention for orchids, carnivorous plants, and terrariums. Hand-harvested and air-dried to preserve natural antimicrobial properties. Perfect for moss poles, propagation, and humidity-loving plants.")
                        .price(new BigDecimal("13.99"))
                        .compareAtPrice(new BigDecimal("17.99"))
                        .category(ProductCategory.SOIL_IMPROVER)
                        .imageUrl("/assets/shop/sphagnum-moss.jpg")
                        .stock(120)
                        .weight("150g")
                        .ingredients("100% New Zealand Sphagnum Moss")
                        .rating(4.9)
                        .reviewCount(201)
                        .featured(true)
                        .build(),

                Product.builder()
                        .name("Pumice Volcanic Stone")
                        .slug("pumice-volcanic-stone")
                        .shortDescription("Natural drainage & aeration amendment")
                        .description(
                                "Natural volcanic pumice stone, perfect for improving soil drainage and aeration. Unlike perlite, pumice doesn't float when watering and maintains its structure indefinitely. Reusable and pH-neutral. Ideal for bonsai, succulents, and as a top dressing.")
                        .price(new BigDecimal("7.99"))
                        .category(ProductCategory.SOIL_IMPROVER)
                        .imageUrl("/assets/shop/pumice.jpg")
                        .stock(350)
                        .weight("3L")
                        .ingredients("100% Natural Volcanic Pumice")
                        .rating(4.6)
                        .reviewCount(98)
                        .featured(false)
                        .build(),

                Product.builder()
                        .name("Calathea & Maranta Mix")
                        .slug("calathea-maranta-mix")
                        .shortDescription("Moisture-retentive mix for prayer plants")
                        .description(
                                "Specially designed for humidity-loving Calatheas, Marantas, and Stromanthe. This mix balances moisture retention with drainage — the key to happy prayer plants. Contains coco coir, fine bark, perlite, worm castings, and activated charcoal to keep roots hydrated without waterlogging.")
                        .price(new BigDecimal("12.99"))
                        .category(ProductCategory.SOIL_MIX)
                        .imageUrl("/assets/shop/calathea-mix.jpg")
                        .stock(130)
                        .weight("5L")
                        .ingredients("Coco Coir, Fine Bark, Perlite, Worm Castings, Activated Charcoal")
                        .rating(4.7)
                        .reviewCount(112)
                        .featured(false)
                        .build(),

                Product.builder()
                        .name("Universal Houseplant Mix")
                        .slug("universal-houseplant-mix")
                        .shortDescription("All-purpose peat-free growing medium")
                        .description(
                                "Our versatile all-purpose mix works beautifully for most common houseplants including Pothos, Dracaena, Spider Plants, and Ferns. 100% peat-free formula enriched with slow-release nutrients for approximately 90 days of feeding. Great for beginners!")
                        .price(new BigDecimal("10.49"))
                        .category(ProductCategory.SOIL_MIX)
                        .imageUrl("/assets/shop/universal-mix.jpg")
                        .stock(350)
                        .weight("5L")
                        .ingredients("Coco Coir, Bark, Perlite, Compost, Slow-release Fertilizer")
                        .rating(4.5)
                        .reviewCount(287)
                        .featured(false)
                        .build(),

                Product.builder()
                        .name("Coconut Husk Chips")
                        .slug("coconut-husk-chips")
                        .shortDescription("Chunky orchid & anthurium substrate")
                        .description(
                                "Premium coconut husk chips provide excellent aeration and structural support for orchids, anthuriums, and other epiphytic plants. Triple-washed to remove excess salts. Breaks down slower than bark, offering long-lasting growing media with natural anti-fungal properties.")
                        .price(new BigDecimal("7.49"))
                        .category(ProductCategory.SOIL_IMPROVER)
                        .imageUrl("/assets/shop/coconut-chips.jpg")
                        .stock(220)
                        .weight("5L")
                        .ingredients("100% Coconut Husk Chips")
                        .rating(4.4)
                        .reviewCount(76)
                        .featured(false)
                        .build());

        productRepository.saveAll(products);
        log.info("✅ Seeded {} shop products", products.size());
    }
}
