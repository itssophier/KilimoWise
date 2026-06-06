package com.example.kilimosmart.auth.jwt;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.stereotype.Service;

import java.util.Date;

@Service
public class JwtService {

    private final String SECRET = "my_super_secret_key_123456";

    public String generateToken(Long farmerId) {
        return Jwts.builder()
                .setSubject(String.valueOf(farmerId))
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 86400000)) // 1 day
                .signWith(SignatureAlgorithm.HS256, SECRET)
                .compact();
    }

    public Long extractFarmerId(String token) {
        return Long.parseLong(
                Jwts.parser()
                        .setSigningKey(SECRET)
                        .parseClaimsJws(token)
                        .getBody()
                        .getSubject()
        );
    }
}
