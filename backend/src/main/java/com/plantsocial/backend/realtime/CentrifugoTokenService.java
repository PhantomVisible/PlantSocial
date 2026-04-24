package com.plantsocial.backend.realtime;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class CentrifugoTokenService {

    private static final long TOKEN_TTL_MS = 25 * 60 * 1000L; // 25 minutes

    private final SecretKey signingKey;

    public CentrifugoTokenService(@Value("${centrifugo.token.hmac-secret}") String hmacSecret) {
        this.signingKey = Keys.hmacShaKeyFor(hmacSecret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Mints a short-lived Centrifugo connection JWT signed with HS256.
     * The {@code sub} claim must be the Keycloak user UUID — Centrifugo uses it
     * as the client identity for channel permissions and presence.
     */
    public String generateConnectionToken(String userUuid) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject(userUuid)
                .issuedAt(new Date(now))
                .expiration(new Date(now + TOKEN_TTL_MS))
                .signWith(signingKey, Jwts.SIG.HS256)
                .compact();
    }
}
