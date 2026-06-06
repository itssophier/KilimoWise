package com.example.kilimosmart.auth.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    private static final int MIN_SECRET_BYTES = 32;

    @Value("${jwt.secret:}")
    private String secretString;

    @Value("${jwt.expiration:86400000}")
    private long expirationMs;

    private SecretKey secretKey;

    @PostConstruct
    public void init() {
        if (secretString == null || secretString.isBlank()) {
            throw new IllegalStateException(
                    "JWT_SECRET env var (or jwt.secret property) must be set to a strong secret (>= "
                            + MIN_SECRET_BYTES + " bytes). Refusing to start.");
        }
        byte[] keyBytes = secretString.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < MIN_SECRET_BYTES) {
            throw new IllegalStateException(
                    "JWT_SECRET must be at least " + MIN_SECRET_BYTES + " bytes (256 bits) for HS256. Got "
                            + keyBytes.length + " bytes. Refusing to start.");
        }
        this.secretKey = Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(Long farmerId) {
        Date now = new Date();
        return Jwts.builder()
                .setSubject(String.valueOf(farmerId))
                .setIssuedAt(now)
                .setExpiration(new Date(now.getTime() + expirationMs))
                .signWith(secretKey)
                .compact();
    }

    public Long extractFarmerId(String token) {
        Jws<Claims> jws = Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token);
        return Long.parseLong(jws.getBody().getSubject());
    }
}
