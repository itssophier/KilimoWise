package com.example.kilimosmart.auth.jwt;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertEquals;

class JwtServiceTest {

    @Test
    void rejectsMissingSecret() {
        JwtService svc = new JwtService();
        org.springframework.test.util.ReflectionTestUtils.setField(svc, "secretString", "");
        assertThrows(IllegalStateException.class, svc::init);
    }

    @Test
    void rejectsShortSecret() {
        JwtService svc = new JwtService();
        org.springframework.test.util.ReflectionTestUtils.setField(svc, "secretString", "short");
        assertThrows(IllegalStateException.class, svc::init);
    }

    @Test
    void generatesAndParsesTokenRoundTrip() {
        JwtService svc = new JwtService();
        org.springframework.test.util.ReflectionTestUtils.setField(svc, "secretString",
                "test-secret-for-junit-only-32-bytes-or-more-1234567890");
        org.springframework.test.util.ReflectionTestUtils.setField(svc, "expirationMs", 60_000L);
        svc.init();

        String token = svc.generateToken(42L);
        assertNotNull(token);
        assertEquals(42L, svc.extractFarmerId(token));
    }
}
