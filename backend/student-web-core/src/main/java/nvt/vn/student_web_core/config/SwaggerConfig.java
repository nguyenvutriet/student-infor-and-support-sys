package nvt.vn.student_web_core.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.ExternalDocumentation;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {
    @Bean
    public OpenAPI customOpenAPI() {
        SecurityScheme bearerScheme = new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
                .description("JWT Bearer Token");

        SecurityRequirement bearerRequirement = new SecurityRequirement()
                .addList("Bearer Authentication")
                ;

        return new OpenAPI()
                .info(new Info().title("Spring Boot Project for Student Info and Support Sys")
                        .version("1.0")
                        .description("This is a Spring Boot Project for Student Info and Support Sys")
                        .license(new License().name("Apache 2.0").url("https://embarkx.com"))
                        .contact(new Contact().name("Nguyen Vu Triet").email("nguyenvutriet@gmail.com").url("https://github.com/nguyenvutriet")))
                .externalDocs(new ExternalDocumentation().description("Project Documentation").url("https://embarkx.com"))
                .components(new Components().addSecuritySchemes("Bearer Authentication", bearerScheme))
                .addSecurityItem(bearerRequirement);
    }
}
