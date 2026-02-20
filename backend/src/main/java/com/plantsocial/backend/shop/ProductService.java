package com.plantsocial.backend.shop;

import com.plantsocial.backend.shop.dto.ProductDTO;
import com.plantsocial.backend.shop.model.Product;
import com.plantsocial.backend.shop.model.ProductCategory;
import com.plantsocial.backend.shop.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    public List<ProductDTO> getAllProducts(String category, String sort, String search) {
        List<Product> products;

        if (search != null && !search.isBlank()) {
            products = productRepository.searchByName(search.trim());
        } else if (category != null && !category.isBlank()) {
            try {
                ProductCategory cat = ProductCategory.valueOf(category.toUpperCase());
                products = productRepository.findByCategoryAndActiveTrue(cat);
            } catch (IllegalArgumentException e) {
                products = productRepository.findByActiveTrueOrderByCreatedAtDesc();
            }
        } else {
            products = productRepository.findByActiveTrueOrderByCreatedAtDesc();
        }

        // Sort
        if (sort != null) {
            switch (sort.toLowerCase()) {
                case "price_asc" -> products.sort(Comparator.comparing(Product::getPrice));
                case "price_desc" -> products.sort(Comparator.comparing(Product::getPrice).reversed());
                case "name_asc" -> products.sort(Comparator.comparing(Product::getName));
                case "name_desc" -> products.sort(Comparator.comparing(Product::getName).reversed());
                case "rating" -> products.sort(Comparator.comparing(Product::getRating).reversed());
                default -> {
                } // keep default order
            }
        }

        return products.stream().map(ProductDTO::from).toList();
    }

    public ProductDTO getProductBySlug(String slug) {
        Product product = productRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Product not found: " + slug));
        return ProductDTO.from(product);
    }

    public List<ProductDTO> getFeaturedProducts() {
        return productRepository.findByFeaturedTrueAndActiveTrueOrderByCreatedAtDesc()
                .stream().map(ProductDTO::from).toList();
    }
}
