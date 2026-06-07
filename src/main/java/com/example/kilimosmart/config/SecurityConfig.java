package com.example.kilimosmart.config;

import com.example.kilimosmart.auth.jwt.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> {})
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .logout(l -> l.disable())
                .anonymous(a -> a.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(PathPatternRequestMatcher.withDefaults().matcher(HttpMethod.OPTIONS, "/**")).permitAll()
                        .requestMatchers(PathPatternRequestMatcher.withDefaults().matcher("/graphql")).permitAll()
                        .requestMatchers(PathPatternRequestMatcher.withDefaults().matcher("/graphql/**")).permitAll()
                        .requestMatchers(PathPatternRequestMatcher.withDefaults().matcher("/graphiql")).permitAll()
                        .requestMatchers(PathPatternRequestMatcher.withDefaults().matcher("/graphiql/**")).permitAll()
                        .requestMatchers(PathPatternRequestMatcher.withDefaults().matcher("/actuator/health")).permitAll()
                        .requestMatchers(PathPatternRequestMatcher.withDefaults().matcher("/actuator/health/**")).permitAll()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
