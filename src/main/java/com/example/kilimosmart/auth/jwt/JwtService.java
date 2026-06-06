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

    @Value("${jwt.secret:}")
    private String secretString;

    @Value("${jwt.expiration:86400000}")
    private long expirationMs;

    private SecretKey secretKey;

    @PostConstruct
    public void init() {
        if (secretString == null || secretString.isBlank()) {
            throw new IllegalStateException(
                    "jwt.secret property (or JWT_SECRET env var) must be set to a strong secret (>= 32 bytes).");
        }
        byte[] keyBytes = secretString.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            throw new IllegalStateException(
                    "jwt.secret must be at least 32 bytes (256 bits) for HS256. Got " + keyBytes.length + " bytes.");
        }
        secretKey = Keys.hmacShaKeyFor(keyBytes);
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
